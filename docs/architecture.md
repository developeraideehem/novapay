# NovaPay Architecture Guidelines

## Overview
NovaPay is a highly available, secure fintech application deployed on AWS using Kubernetes (Kops). The system is designed to survive Availability Zone failures and maintain strict least-privilege security.

## Network Architecture
- **VPC CIDR**: `10.0.0.0/16` (Provides 65,536 addresses for future scale)
- **Subnets**: 6 subnets across 3 Availability Zones (us-east-1a, 1b, 1c)
  - **3 Public Subnets**: Used for NAT Gateways and External Load Balancers.
  - **3 Private Subnets**: Hosting the Kubernetes Worker Nodes (isolated from direct internet access).
- **NAT Gateways**: Redundant (1 per AZ) ensuring no single point of failure for outbound node traffic.

## Kubernetes Cluster (Kops)
- **Toplogy**: Private (Nodes have no public IPs).
- **Control Plane**: 3 Masters (EC2 t3.medium) for high availability.
- **Workers**: 3 Nodes (EC2 t3.medium) with Auto-scaling enabled.
- **Networking**: Calico CNI for Pod networking and NetworkPolicy enforcement.
- **Ingress**: NGINX Ingress Controller for path-based routing.

## Application Architecture
- **Frontend**: 2+ replicas of the Nginx-served Vite app.
- **Backend API**: 2+ replicas of the Node.js Express server.
  - **Resource Limits**: 526Mi Memory (Hard limit as per requirements).
- **Database**: PostgreSQL StatefulSet with EBS Persistent Volumes (gp2/gp3) and a Retain policy.

## Security Model
- **IAM**: Least-privilege roles for master/node instance profiles. No root credentials used.
- **Secrets Management**: Sensitive keys (Paystack, Supabase) are stored in K8s Secrets (encrypted at rest).
- **SSL/TLS**: Automated certificate rotation via `cert-manager` and Let's Encrypt for `novaapay.site`.
