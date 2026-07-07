from django_filters import rest_framework as filters
from .models import Transaction

class TransactionFilter(filters.FilterSet):
    start_date = filters.DateFilter(field_name="date", lookup_expr="gte")
    end_date = filters.DateFilter(field_name="date", lookup_expr="lte")
    status = filters.NumberFilter(field_name="status_id")
    type = filters.NumberFilter(field_name="type_id")
    category = filters.NumberFilter(field_name="category_id")
    subcategory = filters.NumberFilter(field_name="subcategory_id")

    class Meta:
        model = Transaction
        fields = ['start_date', 'end_date', 'status', 'type', 'category', 'subcategory']