import base64
from docusign_esign import (ApiClient, Document, SignHere, Tabs,
                            EnvelopeDefinition, Signer, Recipients,
                            EnvelopesApi, RecipientViewRequest)

def create_api_client(base_path, access_token):
    """Create api client and construct API headers"""
    api_client = ApiClient()
    api_client.host = base_path
    api_client.set_default_header(header_name="Authorization", header_value=f"Bearer {access_token}")
    api_client.set_default_header(header_name='X-DocuSign-Edit',
                                  header_value='xyz')

    return api_client

def create_documents(documents):
    def create_document(document):
        indx, doc = document
        name = doc.get('name', 'Document')
        file_extension = doc.get('file_extension', 'pdf')
        document_id = doc.get('document_id', indx+1)
        file_path = doc['file_path']

        with open(file_path, "rb") as file:
            content_bytes = file.read()
        base64_content = base64.b64encode(content_bytes).decode('ascii')

        return Document(
            document_base64 = base64_content,
            name = name,
            file_extension = file_extension,
            document_id = document_id
        )

    return list(map(create_document, enumerate(documents)))

def create_signers(signers):
    def create_signer(signer):
        indx, info = signer
        recipient_id = info['recipient_id']
        return Signer(
            email=info['email'],
            name=info['name'],
            client_user_id=info['client_id'],
            recipient_id=recipient_id
        )

    return list(map(create_signer, enumerate(signers)))


def assign_sign_here(signers, sign_here={}):
    anchor_string = sign_here.get('anchor_string', '/sn1/')
    anchor_units = sign_here.get('anchor_units', 'pixels')
    anchor_x_offset = sign_here.get('anchor_x_offset', 20)
    anchor_y_offset = sign_here.get('anchor_y_offset', 35)

    for indx, signer in enumerate(signers):
        sign_here = SignHere(
            anchor_string=anchor_string,
            anchor_units=anchor_units,
            anchor_x_offset=anchor_x_offset,
            anchor_y_offset=anchor_y_offset*indx
        )
        signer.tabs = Tabs(sign_here_tabs=[sign_here])

def create_sign_here(sign_here={}, indx=0):
    anchor_string = sign_here.get('anchor_string', '/sn1/')
    anchor_units = sign_here.get('anchor_units', 'pixels')
    anchor_x_offset = sign_here.get('anchor_x_offset', 20)
    anchor_y_offset = sign_here.get('anchor_y_offset', 35)

    return SignHere(
        anchor_string=anchor_string,
        anchor_units=anchor_units,
        anchor_x_offset=anchor_x_offset,
        anchor_y_offset=anchor_y_offset*indx
    )
