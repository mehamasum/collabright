from .views import (DocumentViewSet, CommentViewSet, ArcGISApiViewSet,
                    IntegrationViewSet, DocuSignApiViewSet, AuditViewSet, ContactViewSet)

def register_urls(router):
  router.register('documents', DocumentViewSet, 'document')
  router.register('comments', CommentViewSet, 'comment')
  router.register('integrations', IntegrationViewSet, 'integration')
  router.register('arcgis', ArcGISApiViewSet, 'arcgis')
  router.register('docusign', DocuSignApiViewSet, 'docusign')
  router.register('audits', AuditViewSet, 'audit')
  router.register('contacts', ContactViewSet, 'contact')
