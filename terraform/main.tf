data "aws_availability_zones" "available" {
  state = "available"
}

# -----------------------------------------------------------------------------
# VPC Module (Networking Architecture)
# -----------------------------------------------------------------------------
# VPC CIDR: 10.0.0.0/16
# AZ Coverage: 3 Availability Zones minimum
# Subnets: 3 public, 3 private
# NAT: Redundant NAT Gateways (1 per AZ for high availability)
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "${var.environment}-vpc"
  cidr = var.vpc_cidr

  # Deploy across 3 AZs for high availability
  azs             = slice(data.aws_availability_zones.available.names, 0, 3)
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

  # Enable NAT Gateways for private subnet outbound internet access
  enable_nat_gateway     = true
  single_nat_gateway     = true  # Changed to true to save cost (1 instead of 3 NATs)
  one_nat_gateway_per_az = false # Changed to false

  # Enable DNS hostnames (required for EKS/Kops and certain AWS services)
  enable_dns_hostnames = true
  enable_dns_support   = true

  # Tags required by Kops to identify which subnets to use for the cluster
  public_subnet_tags = {
    "kubernetes.io/cluster/${var.cluster_name}" = "shared"
    "kubernetes.io/role/elb"                      = "1"
  }

  private_subnet_tags = {
    "kubernetes.io/cluster/${var.cluster_name}" = "shared"
    "kubernetes.io/role/internal-elb"             = "1"
  }
}

# -----------------------------------------------------------------------------
# DNS Architecture (Route53)
# -----------------------------------------------------------------------------
# Domain Name: As identified from the user constraints, using their domain
resource "aws_route53_zone" "primary" {
  name = var.cluster_name
}

# -----------------------------------------------------------------------------
# IAM Roles & Policies
# -----------------------------------------------------------------------------
module "iam" {
  source       = "./modules/iam"
  cluster_name = var.cluster_name
}

