terraform {
  required_version = ">= 1.5.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # NOTE: The S3 bucket and DynamoDB table must be created manually 
  # or via a separate bootstrap terraform configuration before this backend can be used.
  backend "s3" {
    bucket         = "novapay-terraform-state-bucket" 
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "novapay-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment
      Project     = "NovaPay"
      ManagedBy   = "Terraform"
      # This tag is critical for kops to discover the VPC
      "kubernetes.io/cluster/${var.cluster_name}" = "shared"
    }
  }
}
