from django.db import models

class Contact(models.Model):
    first_name = models.CharField(max_length=80)
    last_name = models.CharField(max_length=80)

class Email(models.Model):
    contact = models.ForeignKey(Contact, on_delete=models.CASCADE, related_name="emails")
    address = models.EmailField()