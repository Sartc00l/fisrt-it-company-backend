from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from api.filters import TransactionFilter
from api.models import Type, Category, Subcategory, Status, Transaction
from api.serializers import (
    TypeSerializer,
    CategorySerializer,
    SubcategorySerializer,
    StatusSerializer,
    TransactionSerializer,
)

class TransactionViewSet(viewsets.ModelViewSet):
    # Объединили select_related и сортировку в один правильный queryset
    queryset = Transaction.objects.select_related('status', 'type', 'category', 'subcategory').all().order_by('-date', '-id')
    serializer_class = TransactionSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = TransactionFilter

class TypeViewSet(viewsets.ModelViewSet):
    queryset = Type.objects.all()
    serializer_class = TypeSerializer

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

class SubcategoryViewSet(viewsets.ModelViewSet):
    queryset = Subcategory.objects.all()
    serializer_class = SubcategorySerializer

class StatusViewSet(viewsets.ModelViewSet):
    queryset = Status.objects.all()
    serializer_class = StatusSerializer