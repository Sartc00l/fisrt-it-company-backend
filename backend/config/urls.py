from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from api.views import TypeViewSet, CategoryViewSet, SubcategoryViewSet, StatusViewSet, TransactionViewSet

router = DefaultRouter()
router.register(r'types', TypeViewSet, basename='type')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'subcategories', SubcategoryViewSet, basename='subcategory')
router.register(r'statuses', StatusViewSet, basename='status')
router.register(r'transactions', TransactionViewSet, basename='transaction')

urlpatterns = [
    path('admin/', admin.site.url_backends if hasattr(admin.site, 'url_backends') else admin.site.urls),
    path('api/', include(router.urls)),
]