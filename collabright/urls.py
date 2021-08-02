from django.contrib import admin
from django.conf import settings
from django.urls import path, re_path
from django.conf.urls import include
from rest_framework.schemas import get_schema_view
from rest_framework.documentation import include_docs_urls
from .router import DefaultRouterWithAPIViews as DefaultRouter
from .views import react

from collabright.base.urls import register_urls as register_base_urls
from django.conf.urls.static import static

drf_session_auth_urls = include('rest_framework.urls')

# TODO: add schema viewer and docs
# https://www.django-rest-framework.org/api-guide/schemas/


urlpatterns = [
    path('api/drf-auth/', drf_session_auth_urls),
    path('api/admin/', admin.site.urls),
    path('api/auth/', include('djoser.urls')),
    path('api/auth/', include('djoser.urls.authtoken')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)


router = DefaultRouter()
register_base_urls(router)
urlpatterns += [ path('api/v1/', include(router.urls)),]

urlpatterns += [
    re_path(r'^(?P<path>.*)/$', react),
    path('', react),
]
