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
    class Meta:
        model = Transaction
        fields = '__all__'

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