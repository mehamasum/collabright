import json
from .models import (Integration)
from rauth import OAuth2Service
from datetime import datetime, timedelta
from django.utils import timezone
import requests
from django.conf import settings

def json_decoder(payload):
    return json.loads(payload.decode('utf-8'))

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
            'redirect_uri': ArcGISOAuthService.redirect_uri
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

        if now > expiry_date:
          return integration.access_token

        refresh_token = integration.refresh_token
        refresh_expiry_date = integration.refresh_expiry_date

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
    def get_map_info(user, base_url, map_id):
        token = ArcGISOAuthService.get_access_token(user)
        
        params = {
            'f': 'json',
            'token': token,
        }

        item_url = f'{base_url}/sharing/rest/content/items/{map_id}'
        item = requests.get(item_url, params).json()

        item_data_url = f'{base_url}/sharing/rest/content/items/{map_id}/data'
        item_data = requests.get(item_data_url, params).json()


        return {
          'item': item,
          'itemData': item_data
        }
