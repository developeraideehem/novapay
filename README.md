# NovaPay – Digital Wallet & Payments

NovaPay is a secure, high-availability fintech application built with React/Vite (Frontend) and Node.js Express (Backend). This project demonstrates a production-grade DevOps deployment on AWS using Terraform and Kubernetes (Kops).

## 🚀 Key Features
- **High Availability**: 3-master, 3-worker Kubernetes cluster spread across 3 Availability Zones.
- **Infrastructure as Code**: Full AWS network and security stack managed via Terraform.
- **Secure Architecture**: Private subnet topology with redundant NAT Gateways.
- **Automated SSL/TLS**: Path-based routing with Let's Encrypt managed certificates.
- **Paystack Integration**: Secure server-side payment processing proxy.

## 🏗️ Technical Stack
- **Frontend**: React (Vite) + Nginx
- **Backend**: Node.js (Express)
- **Infrastructure**: Terraform, Kops
- **Orchestration**: Kubernetes, Docker Compose
- **Database**: PostgreSQL (StatefulSet) + Managed Supabase

## 📂 Project Structure
```bash
novapay/
├── backend/        # Node.js API server
├── docs/           # Architecture, Runbook, and Cost Analysis
├── k8s/            # Kubernetes Manifests (Kustomize)
├── kops/           # Cluster creation scripts
├── scripts/        # Cleanup and destroy scripts
├── terraform/      # AWS Infrastructure (VPC, IAM, DNS)
└── web/            # Vite Frontend application
```

## 🛠️ Quick Start
1. **Local Development**:
   ```bash
   docker compose up --build
   ```
2. **Setup AWS Infrastructure**:
   See the [Operational Runbook](docs/runbook.md) for detailed deployment steps.

3. **Cleanup**:
   Run `./scripts/destroy.sh` to tear down all cloud resources.

## 📋 Documentation
- [Architecture Design](docs/architecture.md)
- [Operational Runbook](docs/runbook.md)
- [Cost Analysis](docs/cost-analysis.md)
