import boto3
from .base_storage import BaseStorage


class S3Storage(BaseStorage):

    def __init__(self, bucket_name):
        self.s3 = boto3.client("s3")
        self.bucket = bucket_name

    def save(self, file, file_path):
        self.s3.upload_fileobj(file.file, self.bucket, file_path)
        return f"https://{self.bucket}.s3.amazonaws.com/{file_path}"

    def delete(self, file_path):
        self.s3.delete_object(Bucket=self.bucket, Key=file_path)