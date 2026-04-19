output "vpc_id" {
  description = "The ID of the VPC"
  value       = module.vpc.vpc_id
}

output "private_subnets" {
  description = "List of IDs of private subnets"
  value       = module.vpc.private_subnets
}

output "public_subnets" {
  description = "List of IDs of public subnets"
  value       = module.vpc.public_subnets
}

output "route53_zone_id" {
  description = "The ID of the Route53 hosted zone"
  value       = aws_route53_zone.primary.zone_id
}

output "route53_name_servers" {
  description = "The name servers for the Route53 hosted zone. These must be updated at your domain registrar."
  value       = aws_route53_zone.primary.name_servers
}
