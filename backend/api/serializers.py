from rest_framework import serializers
from api.models import Type, Category, Subcategory, Status, Transaction


class TypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Type
        fields = '__all__'


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'


class SubcategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Subcategory
        fields = '__all__'


class StatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Status
        fields = '__all__'


class TransactionSerializer(serializers.ModelSerializer):
    status_details = StatusSerializer(source='status', read_only=True)
    type_details = TypeSerializer(source='type', read_only=True)
    category_details = CategorySerializer(source='category', read_only=True)
    subcategory_details = SubcategorySerializer(source='subcategory', read_only=True)

    class Meta:
        model = Transaction
        fields = [
            'id', 'date', 'amount', 'comment', 
            'status', 'type', 'category', 'subcategory',
            'status_details', 'type_details', 'category_details', 'subcategory_details'
        ]

    def validate(self, attrs):
        transaction_type = attrs.get('type')
        category = attrs.get('category')
        subcategory = attrs.get('subcategory')

        if category and transaction_type and category.type != transaction_type:
            raise serializers.ValidationError({
                "category": f"The category '{category.name}' does not correspond to the type '{transaction_type.name}'."
            })

        if subcategory and category and subcategory.category != category:
            raise serializers.ValidationError({
                "subcategory": f"The subcategory '{subcategory.name}' does not belong to this type '{category.name}'."
            })

        return attrs