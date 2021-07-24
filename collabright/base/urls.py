from .views import (DocumentViewSet, CommentViewSet)

def register_urls(router):
  router.register('documents', DocumentViewSet, 'document')
  router.register('comments', CommentViewSet, 'comment')
