import abc
import os
import uuid
from pathlib import Path

from app.core.config import get_settings

settings = get_settings()


class BaseStorageService(abc.ABC):
    """Abstract storage interface for file persistence (local disk, S3, R2, etc.)."""

    @abc.abstractmethod
    def save_file(self, content: bytes, filename: str, subfolder: str = "") -> str:
        """Save file content and return the storage identifier/path."""
        pass

    @abc.abstractmethod
    def get_file(self, file_path_or_key: str) -> bytes:
        """Retrieve binary file content by storage path or key."""
        pass

    @abc.abstractmethod
    def file_exists(self, file_path_or_key: str) -> bool:
        """Check whether a file exists."""
        pass

    @abc.abstractmethod
    def delete_file(self, file_path_or_key: str) -> bool:
        """Delete a file if it exists."""
        pass


class LocalDiskStorageService(BaseStorageService):
    """Local disk file storage implementation for development and low-resource environments."""

    def __init__(self, base_dir: str | None = None):
        self.base_dir = Path(base_dir or settings.STORAGE_DIR)
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def save_file(self, content: bytes, filename: str, subfolder: str = "") -> str:
        target_dir = self.base_dir / subfolder if subfolder else self.base_dir
        target_dir.mkdir(parents=True, exist_ok=True)

        # Sanitize filename to avoid directory traversal
        safe_filename = Path(filename).name
        target_path = target_dir / safe_filename
        target_path.write_bytes(content)
        return str(target_path.resolve())

    def get_file(self, file_path_or_key: str) -> bytes:
        path = Path(file_path_or_key)
        if not path.is_file():
            raise FileNotFoundError(f"File not found: {file_path_or_key}")
        return path.read_bytes()

    def file_exists(self, file_path_or_key: str) -> bool:
        return Path(file_path_or_key).is_file()

    def delete_file(self, file_path_or_key: str) -> bool:
        path = Path(file_path_or_key)
        if path.is_file():
            path.unlink()
            return True
        return False


class S3StorageService(BaseStorageService):
    """S3 / Cloudflare R2 swappable storage implementation."""

    def __init__(self):
        # TODO: replace with real S3/R2 client initialization (boto3 / aiobotocore)
        pass

    def save_file(self, content: bytes, filename: str, subfolder: str = "") -> str:
        # TODO: replace with real S3 upload call (s3_client.put_object)
        raise NotImplementedError("S3 storage is not yet configured with real API keys.")

    def get_file(self, file_path_or_key: str) -> bytes:
        # TODO: replace with real S3 get_object call
        raise NotImplementedError("S3 storage is not yet configured with real API keys.")

    def file_exists(self, file_path_or_key: str) -> bool:
        # TODO: replace with real S3 head_object call
        raise NotImplementedError("S3 storage is not yet configured with real API keys.")

    def delete_file(self, file_path_or_key: str) -> bool:
        # TODO: replace with real S3 delete_object call
        raise NotImplementedError("S3 storage is not yet configured with real API keys.")


# Default storage singleton: local disk for now
storage_service: BaseStorageService = LocalDiskStorageService()
