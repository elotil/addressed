from django.shortcuts import render
from rest_framework import generics
from .models import Contact
from .serializers import ContactSerializer

class ContactListView(generics.ListCreateAPIView):
    queryset = Contact.objects.all()
    serializer_class = ContactSerializer

class ContactDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Contact.objects.all()
    serializer_class = ContactSerializer

def index(request):
    return render(request, "contacts/index.html")