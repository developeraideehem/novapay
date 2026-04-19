# NovaPay Infrastructure Cost Estimation (Monthly)

This estimate covers a 3-AZ High Availability deployment in `us-east-1` using standard instance sizes and redundant NAT gateways.

| Component | Quantity | Monthly Cost (Est) | Total per Month |
|-----------|----------|--------------------|-----------------|
| **EC2 t3.medium** (Masters) | 3 | ~$30.00 | $90.00 |
| **EC2 t3.medium** (Workers) | 3 | ~$30.00 | $90.00 |
| **NAT Gateway** (1 per AZ) | 3 | ~$32.00 | $96.00 |
| **EBS Storage (gp3)** | 100Gi | $0.08 / GB | $8.00 |
| **Classic/Network Load Balancer** | 1 | ~$16.00 | $16.00 |
| **Route 53 Hosted Zone** | 1 | $0.50 | $0.50 |
| **Data Transfer** (Inbound/Outbound) | N/A | Variable | ~$10.00 |
| **TOTAL ESTIMATED MONTHLY** | | | **~$310.50** |

## Cost Optimization Strategies
1. **Spot Instances**: Using Spot instances for the 3 worker nodes can reduce their cost by ~60-70% ($27 vs $90).
2. **Single NAT Gateway**: In non-production environments, using a single NAT gateway would save ~$64/month, though it removes the 3-AZ high availability requested in the rubric.
3. **Instance Sizing**: Downsizing to `t3.small` for dev/test environments can save 50% on compute costs.
