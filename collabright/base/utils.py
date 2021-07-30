import base64
from docusign_esign import (ApiClient, Document, SignHere, Tabs,
                            EnvelopeDefinition, Signer, Recipients,
                            EnvelopesApi, RecipientViewRequest)

def create_api_client(base_path, access_token):
    """Create api client and construct API headers"""
    api_client = ApiClient()
    api_client.host = base_path
    api_client.set_default_header(header_name="Authorization", header_value=f"Bearer {access_token}")

    return api_client

def make_envelope(args):
    """
    Creates envelope
    args -- parameters for the envelope:
    signer_email, signer_name, signer_client_id
    returns an envelope definition
    """

    with open('collabright/base/demo.pdf', "rb") as file:
        content_bytes = file.read()
    base64_file_content = base64.b64encode(content_bytes).decode('ascii')

    # Create the document model
    document = Document( # create the DocuSign document object
        document_base64 = base64_file_content,
        name = 'Example document', # can be different from actual file name
        file_extension = 'pdf', # many different document types are accepted
        document_id = 1 # a label used to reference the doc
    )

    # Create the signer recipient model
    signer = Signer( # The signer
        email = args['signer_email'], name = args['signer_name'],
        recipient_id = "1", routing_order = "1",
        # Setting the client_user_id marks the signer as embedded
        client_user_id = args['signer_client_id']
    )

    # Create a sign_here tab (field on the document)
    sign_here = SignHere( # DocuSign SignHere field/tab
        anchor_string = '/sn1/', anchor_units = 'pixels',
        anchor_y_offset = '10', anchor_x_offset = '20'
    )

    # Add the tabs model (including the sign_here tab) to the signer
    # The Tabs object wants arrays of the different field/tab types
    signer.tabs = Tabs(sign_here_tabs = [sign_here])

    # Next, create the top level envelope definition and populate it.
    envelope_definition = EnvelopeDefinition(
        email_subject = "Please sign this document sent from the Python SDK",
        documents = [document],
        # The Recipients object wants arrays for each recipient type
        recipients = Recipients(signers = [signer]),
        status = "sent" # requests that the envelope be created and sent.
    )

    return envelope_definition

def create_envelope(args):
    envelope_definition = make_envelope(args)

# Call Envelopes::create API method
# Exceptions will be caught by the calling function
    api_client = create_api_client(base_path=args["base_path"], access_token=args["access_token"])

    envelope_api = EnvelopesApi(api_client)
    results = envelope_api.create_envelope(account_id=args["account_id"], envelope_definition=envelope_definition)

    print(results)

    # Create the Recipient View request object
    recipient_view_request = RecipientViewRequest(
        authentication_method = 'email',
        client_user_id = args['signer_client_id'],
        recipient_id = '1',
        return_url = 'http://localhost:3000/',
        user_name = args['signer_name'], email = args['signer_email']
    )
    envelope_id = results.envelope_id

    # Obtain the recipient_view_url for the signing ceremony
    # Exceptions will be caught by the calling function
    results = envelope_api.create_recipient_view(args['account_id'], envelope_id,
        recipient_view_request = recipient_view_request)

    return {'envelope_id': envelope_id, 'redirect_url': results.url}
