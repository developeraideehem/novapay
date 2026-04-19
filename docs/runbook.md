# NovaPay Operational Runbook

## Deployment Procedure

### 1. Provision Infrastructure (Terraform)
Initialize and apply the Terraform configuration to setup the VPC and DNS.
```bash
cd terraform
terraform init
terraform apply -auto-approve
```

### 2. Provision Kubernetes (Kops)
Initialize the cluster using the previously defined VPC. Ensure you export the VPC ID and Subnet IDs from the terraform outputs.
```bash
cd kops
chmod +x create-cluster.sh
./create-cluster.sh
```

### 3. Apply Application Manifests
Once the cluster is "Ready", apply the kustomization.
```bash
kubectl apply -k k8s/base/
```

## Scaling the Cluster
To scale the worker nodes, edit the instance group via Kops:
```bash
kops edit ig nodes.novaapay.site --state=s3://novapay-kops-state-bucket
# Update maxSize and minSize
kops update cluster --name=novaapay.site --yes --admin
```

## Rotating Secrets
To rotate the Paystack or Supabase keys:
1. Update `k8s/base/secrets.yaml`.
2. Apply the change: `kubectl apply -f k8s/base/secrets.yaml`.
3. Restart the backend pods: `kubectl rollout restart deployment novapay-backend -n novapay`.

## Disaster Recovery (Cleanup)
To destroy all cloud resources and stop billing:
```bash
cd scripts
chmod +x destroy.sh
./destroy.sh
```
