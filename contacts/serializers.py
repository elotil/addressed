from rest_framework import serializers
from .models import Contact, Email

class EmailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Email
        fields = ["id", "address"]

class ContactSerializer(serializers.ModelSerializer):
    emails = EmailSerializer(many=True)

    class Meta:
        model = Contact
        fields = ["id", "first_name", "last_name", "emails"]

    def create(self, validated_data):
        emails_data = validated_data.pop("emails")
        contact = Contact.objects.create(**validated_data)

        for email_data in emails_data:
            Email.objects.create(contact=contact, **email_data)

        return contact

    def update(self, instance, validated_data):
        emails_data = validated_data.pop("emails", None)

        instance.first_name = validated_data.get("first_name", instance.first_name)
        instance.last_name = validated_data.get("last_name", instance.last_name)
        instance.save()

        if emails_data is not None:
            instance.emails.all().delete()

            for email_data in emails_data:
                Email.objects.create(contact=instance, **email_data)

        return instance