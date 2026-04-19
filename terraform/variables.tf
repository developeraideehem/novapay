variable "aws_region" {
  description = "The AWS region to deploy resources in"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (e.g. production, staging)"
  type        = string
  default     = "production"
}

variable "cluster_name" {
  description = "The name of the Kubernetes cluster (used for tagging and kops)"
  type        = string
  default     = "novaapay.site" 
}

variable "vpc_cidr" {
  description = "The CIDR block for the VPC. 10.0.0.0/16 allows for up to 65,536 IPs, providing ample space for K8s pod networking and multiple AZ subnets."
  type        = string
  default     = "10.0.0.0/16"
}
