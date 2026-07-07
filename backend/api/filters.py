from django_filters import rest_framework as filters
from .models import Transaction


class TransactionFilter(filters.FilterSet):
    date_from = filters.DateFilter(field_name="date", lookup_expr="gte")
    date_to = filters.DateFilter(field_name="date", lookup_expr="lte")
    status = filters.NumberFilter(field_name="status_id")
    type = filters.NumberFilter(field_name="type_id")
    category = filters.NumberFilter(field_name="category_id")
    subcategory = filters.NumberFilter(field_name="subcategory_id")

    class Meta:
        model = Transaction
        fields = ['date_from', 'date_to', 'status', 'type', 'category', 'subcategory']