import json
from collabright.base.service import ArcGISOAuthService
from rest_framework import serializers
from .models import (Document, Comment, Integration, Audit, Contact, Notification, Reviewer, Organization)
from urllib.parse import urlparse, parse_qs
<<<<<<< HEAD
import validators

=======
from .fields import PDFBase64File
>>>>>>> add agrement upload to audit create

class DocumentSerializer(serializers.ModelSerializer):
    comment_count = serializers.SerializerMethodField()
    class Meta:
        model = Document
        fields = ('id', 'description', 'file', 'audit', 'created_at', 'map_print_definition','comment_count')
        read_only_fields = ('map_item', 'map_item_data', 'created_at', 'file')
    
    def get_comment_count(self, obj):
        return obj.comments.count()

    def create(self, validated_data):
        if 'map_item' not in validated_data and 'map_item_data' not in validated_data:
            audit = validated_data['audit']
            user = self.context.get('request').user
            map_item = ArcGISOAuthService.get_map_item(user, audit.base_url, audit.map_id)
            map_item_data = ArcGISOAuthService.get_map_item_data(user, audit.base_url, audit.map_id)
            if map_item is None or map_item_data is None:
                raise serializers.ValidationError({'auth': 'No GIS service connected or authentication expired.'})

            validated_data['map_item'] = json.dumps(map_item)
            validated_data['map_item_data'] = json.dumps(map_item_data)
        return super(DocumentSerializer, self).create(validated_data)

class DocumentMapSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ('id', 'map_item', 'map_item_data')
        read_only_fields = ('map_item', 'map_item_data')

class CommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ('id', 'document', 'annotation', 'xfdf')



class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = ('id', 'email', 'name', 'created_at')
        read_only_fields = ('created_at',)
    
    def create(self, validated_data):
        user = self.context.get('request').user
        validated_data['created_by'] = user
        return super(ContactSerializer, self).create(validated_data)

class IntegrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Integration
        fields = ('id', 'type', 'expiry_date', 'refresh_expiry_date')

class ReviewerSerializer(serializers.ModelSerializer):
    contact = ContactSerializer()
    class Meta:
        model = Reviewer
        fields = ('id', 'contact', 'audit', 'needs_to_sign', 'has_signed', 'verdict')

class AuditSerializer(serializers.ModelSerializer):
    documents = DocumentSerializer(many=True, read_only=True)
    reviewers = ReviewerSerializer(many=True, read_only=True)
    agrement = PDFBase64File(write_only=True)

    class Meta:
        model = Audit
        fields = ('id', 'title', 'description', 'user', 'map_url', 'base_url',
                  'map_id', 'created_at', 'documents', 'is_open', 'reviewers',
                  'envelope_id', 'agrement')
        read_only_fields = ('user', 'base_url', 'map_id', 'created_at', 'reviewers')

    def validate_map_url(self, value):
        parsed_uri = urlparse(value)
        if 'webmap' not in parse_qs(parsed_uri.query):
            raise serializers.ValidationError('Not an webmap URL')
        return value

    def create(self, validated_data):
        user = self.context.get('request').user
        parsed_uri = urlparse(validated_data['map_url'])
        base_url = '{uri.scheme}://{uri.netloc}'.format(uri=parsed_uri)
        map_id = parse_qs(parsed_uri.query)['webmap'][0]

        map_item = ArcGISOAuthService.get_map_item(user, base_url, map_id)
        map_item_data = ArcGISOAuthService.get_map_item_data(user, base_url, map_id)
        if map_item is None or map_item_data is None:
            raise serializers.ValidationError({'auth': 'No GIS service connected or authentication expired.'})

        validated_data['user'] = user
        validated_data['base_url'] = base_url
        validated_data['map_id'] = map_id
        audit = super(AuditSerializer, self).create(validated_data)


        document_serializer = DocumentSerializer(data={
            'description': "Initial upload",
            'audit': audit.id
        })
        document_serializer.is_valid(raise_exception=True)
        document_serializer.save(map_item=json.dumps(map_item), map_item_data=json.dumps(map_item_data))
        return audit

class NotificationSerializer(serializers.ModelSerializer):
    audit = AuditSerializer(read_only=True)
    reviewer = ReviewerSerializer(read_only=True)
    class Meta:
        model = Notification
        fields = ('id', 'type', 'user', 'audit', 'reviewer', 'created_at', 'read_at')
        read_only_fields = ('type', 'user', 'audit', 'reviewer', 'created_at', 'read_at')

class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ('id', 'name', 'gis_base_url',)

    def validate_gis_base_url(self, value):
        if not validators.url(value):
            raise serializers.ValidationError('Not a valid URL')
        return value
