import json
from collabright.base.service import ArcGISOAuthService
from rest_framework import serializers
from .models import (Document, Comment, Integration, Audit)
from urllib.parse import urlparse, parse_qs

class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ('id', 'description', 'file', 'audit', 'created_at')
        read_only_fields = ('map_item', 'map_item_data', 'map_print_definition', 'created_at')

class CommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ('id', 'document', 'annotation', 'xfdf')

class IntegrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Integration
        fields = ('id', 'type', 'expiry_date', 'refresh_expiry_date')

class AuditSerializer(serializers.ModelSerializer):
    documents = DocumentSerializer(many=True, read_only=True)
    class Meta:
        model = Audit
        fields = ('id', 'title', 'description', 'user', 'map_url', 'base_url', 'map_id', 'created_at', 'documents', 'is_open')
        read_only_fields = ('user', 'base_url', 'map_id', 'created_at')

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

        audit = Audit.objects.create(
            user=user, 
            base_url=base_url,
            map_id=map_id,
            **validated_data
        )

        Document.objects.create(
            map_item=json.dumps(map_item),
            map_item_data=json.dumps(map_item_data),
            audit=audit
        )
        return audit