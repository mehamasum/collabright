import json
import base64
from .models import (Integration, Notification, Reviewer, Audit)
from rauth import OAuth2Service
from datetime import datetime, timedelta
from django.utils import timezone
import requests
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from docusign_esign import (ApiClient, SignHere, Tabs,
                            EnvelopeDefinition, Signer, Recipients,
                            EnvelopesApi, RecipientViewRequest, NameValue,
                            DocumentFieldsInformation, ReturnUrlRequest,
                            LockRequest)
from .utils import (create_api_client, create_documents, create_signers,
                    assign_sign_here, create_sign_here)


def send_email_to_reviewer(user, audit, reviewer, version):
    context = {
        'name': reviewer.contact.name,
        'username': user.username,
        'audit_title': audit.title,
        'presigned_url': settings.APP_URL + '/review/' + str(audit.id) + '/?token=' + reviewer.token
    }
    msg_plain = render_to_string('reviewer.txt', context)
    msg_html = render_to_string('reviewer.html', context)

    send_mail(
        '[Collabright] Review Requested for v{0}.0 of {1}'.format(version, audit.title),
        msg_plain,
        settings.DEFAULT_FROM_EMAIL,
        [reviewer.contact.email],
        html_message=msg_html,
    )

def send_email_to_requester(user, audit, reviewer, verdict):
    context = {
        'name': reviewer.contact.name,
        'username': user.username,
        'audit_title': audit.title,
        'private_url': settings.APP_URL + '/audits/' + str(audit.id) + '/',
        'verdict': 'Approved' if verdict == Reviewer.APPROVED else 'Reqested Change'
    }
    msg_plain = render_to_string('verdict.txt', context)
    msg_html = render_to_string('verdict.html', context)

    send_mail(
        '[Collabright] Review Submitted for {0}'.format(audit.title),
        msg_plain,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        html_message=msg_html,
    )

def send_notification_to_requester(user, audit, reviewer, notifcation_type, payload):
    return Notification.objects.create(
        type=notifcation_type,
        user=user,
        audit=audit,
        reviewer=reviewer,
        payload=payload
    )

def json_decoder(payload):
    return json.loads(payload.decode('utf-8'))


class AuditService:
    def send_envelope(user, audit):
        access_token = DocuSignOAuthService.get_access_token(user)
        envelope_id = str(audit.envelope_id)
        results = DocuSignService.update_envelope({
            'access_token': access_token,
            'envelope_id': envelope_id,
            'envelope': {
                'status': Audit.SENT
            }
        })
        print(results)

        # TODO: error handling
        if results['error_details'] is None:
            audit.status = Audit.SENT
            audit.save()
            return results
        
        return None

class ReviewerService:
    def assign_reviewer_to_audit_evelope(user, audit, reviewers=[]):
        access_token = DocuSignOAuthService.get_access_token(user)
        envelope_id = str(audit.envelope_id)
        signers = []
        for reviewer in reviewers:
            if not reviewer.needs_to_sign:
                print('skipping signer', reviewer.contact.email)
                continue
            signer = {
                'name': reviewer.contact.name,
                'email': reviewer.contact.email,
                'client_id': reviewer.contact_id,
                'recipient_id': reviewer.id
            }
            print('appending signer', reviewer.contact.email)
            signers.append(signer)

        print("signers =>", signers)
        results = None
        if len(signers):
            results = DocuSignService.create_signers({
                'access_token': access_token,
                'envelope_id': envelope_id,
                'signers': signers,
            })
            print('create_signers', results)

        if audit.status == Audit.CREATED:
            try:
                AuditService.update_audit_envelope(user, audit)
            except:
                pass

        return results


class ArcGISOAuthService:
    service = OAuth2Service(
        client_id=settings.ARCGIS_APP_ID,
        client_secret=settings.ARCGIS_APP_SECRET,
        name='arcgis',
        authorize_url='https://www.arcgis.com/sharing/rest/oauth2/authorize/',
        access_token_url='https://www.arcgis.com/sharing/rest/oauth2/token/',
    )
    redirect_uri = settings.APP_URL + '/oauth/callback/arcgis/'


    @staticmethod
    def get_oauth_url():
        params = {
            'response_type': 'code',
            'redirect_uri': ArcGISOAuthService.redirect_uri,
            'expiration': -1
        }
        return ArcGISOAuthService.service.get_authorize_url(**params)
    
    @staticmethod
    def verify_oauth(code, user):
        try:
            r = ArcGISOAuthService.service.get_raw_access_token(data={
                'code': code,
                'redirect_uri': ArcGISOAuthService.redirect_uri,
                'grant_type': 'authorization_code',
            })
            data = json_decoder(r.content)
            """
            {'access_token': '', 'expires_in': 1800, 'username': '', 'ssl': True, 'refresh_token': '', 'refresh_token_expires_in': 1209599}
            """
            access_token = data['access_token']
            expires_in = int(data['expires_in'])
            refresh_token = data['refresh_token']
            refresh_token_expires_in = int(data['refresh_token_expires_in'])

            Integration.objects.update_or_create(
                type=Integration.ARC_GIS,
                user=user,
                defaults={
                    'data': data,
                    'access_token': access_token,
                    'refresh_token': refresh_token,
                    'expiry_date': datetime.now() + timedelta(seconds=expires_in),
                    'refresh_expiry_date': datetime.now() + timedelta(seconds=refresh_token_expires_in)
                }
            )
            return data
        except KeyError:
            return None

    @staticmethod
    def get_access_token(user):
        integration = Integration.objects.get(
            type=Integration.ARC_GIS,
            user=user,
        )
        expiry_date = integration.expiry_date
        now = timezone.now()


        if now < expiry_date:
          return integration.access_token

        refresh_token = integration.refresh_token
        refresh_expiry_date = integration.refresh_expiry_date

        print(now, expiry_date, refresh_expiry_date)

        if now > refresh_expiry_date:
          return None

        try:
            r = ArcGISOAuthService.service.get_raw_access_token(data={
                'refresh_token': refresh_token,
                'redirect_uri': ArcGISOAuthService.redirect_uri,
                'grant_type': 'refresh_token',
            })
            data = json_decoder(r.content)
            """
            {'access_token': '', 'expires_in': 1800, 'username': ''}
            """
            access_token = data['access_token']
            expires_in = int(data['expires_in'])

            updated_integration, _ = Integration.objects.update_or_create(
                type=Integration.ARC_GIS,
                user=user,
                defaults={
                    'access_token': access_token,
                    'expiry_date': datetime.now() + timedelta(seconds=expires_in),
                }
            )
            return updated_integration.access_token
        except KeyError:
            return None
    
    @staticmethod
    def get_map_item(user, base_url, map_id):
        token = ArcGISOAuthService.get_access_token(user)

        print('token', token)
        
        params = {
            'f': 'json',
            'token': token,
        }

        item_url = f'{base_url}/sharing/rest/content/items/{map_id}'
        item = requests.get(item_url, params).json()

        if 'error' in item:
          return None

        return item

    @staticmethod
    def get_map_item_data(user, base_url, map_id):
        token = ArcGISOAuthService.get_access_token(user)
        
        params = {
            'f': 'json',
            'token': token,
        }

        item_data_url = f'{base_url}/sharing/rest/content/items/{map_id}/data'
        item_data = requests.get(item_data_url, params).json()

        if 'error' in item_data:
          return None

        return item_data

    @staticmethod
    def find_layer(layer_id, map_item, map_item_data):
        for op_layer in map_item_data['operationalLayers']:
            if op_layer['id'] == layer_id:
                return op_layer
        
        for bm_layer in map_item_data['baseMap']['baseMapLayers']:
            if bm_layer['id'] == layer_id:
                return bm_layer

        return None

    @staticmethod
    def export_map_as_file(json_map_print_definition, json_map_item, json_map_item_data, print_title):
        json_def = json.loads(json_map_print_definition)
        map_item = json.loads(json_map_item)
        map_item_data = json.loads(json_map_item_data)
        
        # hack for updating image layers to original definition
        for index, op_layer in enumerate(json_def['operationalLayers']):
            if 'type' in op_layer and op_layer['type'] == 'image':
                op_layer_id = op_layer['id']
                found_layer = ArcGISOAuthService.find_layer(op_layer_id, map_item, map_item_data)
                if found_layer:
                    json_def['operationalLayers'][index] = found_layer

        json_def["exportOptions"] = {
            "dpi": 300,
            "outputSize":  [
                1680,
                1050,
            ]
        }
        json_def["layoutOptions"] = {
            "titleText": print_title,
            "scaleBarOptions": {},
            "legendOptions": {"operationalLayers":[]}
        }
        json_def = json.dumps(json_def)

        payload = {
            'f': 'json',
            'Web_Map_as_JSON': json_def,
            'Format': 'PDF',
            'Layout_Template': 'Letter ANSI A Landscape'
        }

        export_url = "https://utility.arcgisonline.com/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task/execute"
        response = requests.post(export_url, data=payload)
        response = response.json()
        
        if 'error' in response:
          return None

        return response

class DocuSignOAuthService:
    service = OAuth2Service(
        client_id=settings.DOCUSIGN_INTEGRATION_KEY,
        client_secret=settings.DOCUSIGN_SECRET_KEY,
        name='arcgis',
        authorize_url="https://account-d.docusign.com/oauth/auth",
        access_token_url="https://account-d.docusign.com/oauth/token"
    )
    redirect_uri = settings.APP_URL + '/oauth/callback/docusign/'

    @staticmethod
    def get_oauth_url():
        params = {
            'response_type': 'code',
            'redirect_uri': DocuSignOAuthService.redirect_uri
        }
        return DocuSignOAuthService.service.get_authorize_url(**params)

    @staticmethod
    def verify_oauth(code, user):
        try:
            authorize_token = "%s:%s" % (settings.DOCUSIGN_INTEGRATION_KEY, settings.DOCUSIGN_SECRET_KEY)
            headers = {"Authorization": "Basic %s" % base64.b64encode(authorize_token.encode())}
            r = DocuSignOAuthService.service.get_raw_access_token(data={
                'code': code,
                'redirect_uri': DocuSignOAuthService.redirect_uri,
                'grant_type': 'authorization_code',
            }, headers=headers)
            data = json_decoder(r.content)
            """
                {'access_token': ...., 'token_type': 'Bearer', 'refresh_token': ..., 'expires_in': 28800}
            """
            access_token = data['access_token']
            expires_in = int(data['expires_in'])
            refresh_token = data['refresh_token']

            Integration.objects.update_or_create(
                type=Integration.DOCU_SIGN,
                user=user,
                defaults={
                    'data': data,
                    'access_token': access_token,
                    'refresh_token': refresh_token,
                    'expiry_date': datetime.now() + timedelta(seconds=expires_in),
                    'refresh_expiry_date': datetime.now() + timedelta(days=29)
                }
            )
            return data
        except KeyError:
            return None

    @staticmethod
    def get_access_token(user):
        integration = Integration.objects.get(
            type=Integration.DOCU_SIGN,
            user=user,
        )
        expiry_date = integration.expiry_date
        now = timezone.now()

        if now < expiry_date:
          return integration.access_token

        refresh_token = integration.refresh_token
        refresh_expiry_date = integration.refresh_expiry_date

        if now > refresh_expiry_date:
          return None

        try:
            r = DocuSignOAuthService.service.get_raw_access_token(data={
                'refresh_token': refresh_token,
                'redirect_uri': DocuSignOAuthService.redirect_uri,
                'grant_type': 'refresh_token',
            })
            data = json_decoder(r.content)
            """
                {'access_token': ...., 'token_type': 'Bearer', 'refresh_token': ..., 'expires_in': 28800}
            """
            access_token = data['access_token']
            expires_in = int(data['expires_in'])

            updated_integration, _ = Integration.objects.update_or_create(
                type=Integration.DOCU_SIGN,
                user=user,
                defaults={
                    'access_token': access_token,
                    'expiry_date': datetime.now() + timedelta(seconds=expires_in),
                }
            )
            return updated_integration.access_token
        except KeyError:
            return None


class DocuSignService:
    base_api_uri = settings.DOCUSIGN_ACCOUNT_BASE_URI + '/restapi'
    account_id = settings.DOCUSIGN_API_ACCOUNT_ID

    @staticmethod
    def make_envelope(args):
        email_subject = args.get(
            'email_subject', 'Please sign this document sent from Collabright')
        documents = create_documents(args['documents'])
        signers = create_signers(args['signers'])
        status = args.get('status', 'created')

        sign_here = args.get('sign_here', {})
        assign_sign_here(signers, sign_here)

        envelope_definition = EnvelopeDefinition(
            email_subject=email_subject,
            documents=documents,
            recipients=Recipients(signers=signers),
            status=status
        )

        return envelope_definition

    @staticmethod
    def create_envelope(args):
        access_token = args['access_token']

        envelope_definition = DocuSignService.make_envelope(args)

        api_client = create_api_client(
            base_path=DocuSignService.base_api_uri,
            access_token=access_token)

        envelope_api = EnvelopesApi(api_client)
        results = envelope_api.create_envelope(
            account_id=DocuSignService.account_id,
            envelope_definition=envelope_definition)

        return results.to_dict()

    @staticmethod
    def update_envelope(args):
        access_token = args['access_token']
        envelope_id = args['envelope_id']
        envelope = args['envelope']

        status = envelope.get('status', 'created')
        envelope_definition = EnvelopeDefinition(status=status)

        api_client = create_api_client(
            base_path=DocuSignService.base_api_uri,
            access_token=access_token)

        envelope_api = EnvelopesApi(api_client)
        results = envelope_api.update(
            account_id=DocuSignService.account_id,
            envelope_id=envelope_id,
            envelope=envelope_definition)

        return results.to_dict()

    @staticmethod
    def sender_view_request(args={}):
        envelope_id = args['envelope_id']
        access_token = args['access_token']
        return_url = args['return_url']

        api_client = create_api_client(
            base_path=DocuSignService.base_api_uri, access_token=access_token)
        envelope_api = EnvelopesApi(api_client)

        results = envelope_api.create_sender_view(
            DocuSignService.account_id,
            envelope_id,
            return_url_request=ReturnUrlRequest(return_url=return_url))

        return results.to_dict()


    @staticmethod
    def recipient_view_request(args={}):
        envelope_id = args['envelope_id']
        access_token = args['access_token']
        recipient = args['recipient']
        return_url = args['return_url']

        api_client = create_api_client(
            base_path=DocuSignService.base_api_uri, access_token=access_token)
        envelope_api = EnvelopesApi(api_client)

        recipient_view_request = RecipientViewRequest(
            authentication_method = 'email',
            client_user_id = recipient['client_id'],
            return_url = return_url,
            user_name = recipient['name'],
            email = recipient['email']
        )

        results = envelope_api.create_recipient_view(
            DocuSignService.account_id,
            envelope_id,
            recipient_view_request=recipient_view_request)

        return results.to_dict()

    @staticmethod
    def update_document(args):
        access_token = args['access_token']
        envelope_id = args['envelope_id']

        documents = create_documents(args['documents'])
        envelope_definition = EnvelopeDefinition(documents=documents,)

        api_client = create_api_client(
            base_path=DocuSignService.base_api_uri,
            access_token=access_token)

        envelope_api = EnvelopesApi(api_client)

        results = envelope_api.update_documents(
            account_id=DocuSignService.account_id,
            envelope_id=envelope_id,
            envelope_definition=envelope_definition)

        return results.to_dict()

    @staticmethod
    def create_signers(args):
        access_token = args['access_token']
        envelope_id = args['envelope_id']

        api_client = create_api_client(
            base_path=DocuSignService.base_api_uri,
            access_token=access_token)

        envelope_api = EnvelopesApi(api_client)

        signers = create_signers(args['signers'])
        results = envelope_api.create_recipient(
            account_id=DocuSignService.account_id,
            envelope_id=envelope_id,
            recipients = Recipients(signers=signers))

        for signer in args['signers']:
            """
            DocuSignService.create_tabs({
                'access_token': access_token,
                'envelope_id': envelope_id,
                'recipient_id': signer['recipient_id']
            })
            """


        return results.to_dict()

    @staticmethod
    def create_lock(args):
        access_token = args['access_token']
        envelope_id = args['envelope_id']

        api_client = create_api_client(
            base_path=DocuSignService.base_api_uri,
            access_token=access_token)

        envelope_api = EnvelopesApi(api_client)

        results = envelope_api.create_lock(
            account_id=DocuSignService.account_id,
            envelope_id=envelope_id,
            lock_request=LockRequest(lock_type='edit', lock_duration_in_seconds=60))

        return results.to_dict()

    @staticmethod
    def create_tabs(args):
        access_token = args['access_token']
        envelope_id = args['envelope_id']
        recipient_id = args['recipient_id']

        api_client = create_api_client(
            base_path=DocuSignService.base_api_uri,
            access_token=access_token)

        envelope_api = EnvelopesApi(api_client)

        #TODO fix sign here position logic
        sign_here = create_sign_here()
        results = envelope_api.create_tabs(
            account_id=DocuSignService.account_id,
            envelope_id=envelope_id,
            recipient_id=recipient_id,
            tabs=Tabs(sign_here_tabs=[sign_here]))

        return results.to_dict()

    def handle_webhook_request(envelope):
        print(envelope)
        envelopeId = envelope.get('envelopeId', None)
        status = envelope.get('status', None)

        try:
            audit = Audit.objects.get(envelope_id=envelopeId)
        except Audit.DoesNotExist:
            audit = None
        if audit and audit.status != status:
            audit.status = status
            audit.save()

        recipients = envelope.get('recipients', {})
        signers = recipients.get('signers', [])
        complete_signers = [
            int(signer['recipientId'])
            for signer in signers if signer['status']=='completed']
        Reviewer.objects.filter(
            id__in=complete_signers, has_signed=False).update(has_signed=True)
        print(complete_signers)
