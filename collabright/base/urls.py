from .views import (UserViewSet, GroupViewSet)

def register_urls(router):
  router.register(r'users', UserViewSet)
  router.register(r'groups', GroupViewSet)
