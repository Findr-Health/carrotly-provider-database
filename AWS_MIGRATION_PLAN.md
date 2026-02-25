# AWS MIGRATION PLAN - Findr Health Backend
**Prepared:** February 7, 2026  
**Target:** Move from Railway to AWS for production scale  
**Timeline:** 7-11 days  
**Budget:** $50-150/month (startup tier)

---

## 🎯 MIGRATION GOALS

1. **Improved Reliability** - Better uptime SLA than Railway
2. **Cost Control** - Predictable pricing, reserved capacity
3. **Scalability** - Handle 10x growth without infrastructure changes
4. **Email Delivery** - Replace Gmail SMTP with AWS SES
5. **Monitoring** - CloudWatch integration for observability
6. **Compliance** - HIPAA-eligible infrastructure (future requirement)

---

## 🏗️ PROPOSED AWS ARCHITECTURE

### **Option A: ECS Fargate (Recommended)**
```
┌─────────────────┐
│  Route53 DNS    │
└────────┬────────┘
         │
┌────────▼────────┐
│ ALB (SSL/HTTPS) │
└────────┬────────┘
         │
┌────────▼────────────────┐
│  ECS Fargate Service    │
│  - Auto-scaling 2-10    │
│  - Health checks        │
│  - Rolling updates      │
└────────┬────────────────┘
         │
┌────────┴────────────────┐
│                         │
│  ┌──────────────┐      │  ┌──────────────┐
│  │ DocumentDB   │      │  │     SES      │
│  │  (MongoDB)   │      │  │    Email     │
│  └──────────────┘      │  └──────────────┘
│                         │
│  ┌──────────────┐      │  ┌──────────────┐
│  │  ElastiCache │      │  │     SNS      │
│  │    Redis     │      │  │    Push      │
│  └──────────────┘      │  └──────────────┘
│                         │
└─────────────────────────┘
```

**Pros:**
- Serverless, no server management
- Automatic scaling
- Pay only for actual usage
- Integrated with AWS ecosystem

**Cons:**
- Slightly higher cost than EC2
- Cold start delays (minimal with ALB health checks)

**Monthly Cost Estimate:** $80-120

---

### **Option B: EC2 with Auto Scaling**
```
┌─────────────────┐
│  Route53 DNS    │
└────────┬────────┘
         │
┌────────▼────────┐
│ ALB (SSL/HTTPS) │
└────────┬────────┘
         │
┌────────▼────────────────┐
│  Auto Scaling Group     │
│  - t3.small x 2-4       │
│  - CloudWatch alarms    │
└────────┬────────────────┘
         │
└────────┴── Same as Option A
```

**Pros:**
- Lower cost at small scale
- More control over environment
- Persistent storage

**Cons:**
- Server management overhead
- Manual scaling configuration
- OS patching required

**Monthly Cost Estimate:** $50-80

---

### **Option C: Lambda + API Gateway (Future Consideration)**

**Not Recommended for Now:**
- Major code refactoring required
- Cold start issues for booking endpoint
- Better suited for event-driven workloads
- Consider for notification processing only

---

## 📊 DETAILED COST BREAKDOWN

### **ECS Fargate Option (Recommended)**

| Service | Spec | Cost/Month |
|---------|------|------------|
| **ECS Fargate** | 0.5 vCPU, 1GB RAM, 2 tasks | $30 |
| **ALB** | 1 instance, 1GB/month transfer | $20 |
| **DocumentDB** | db.t3.medium, single-AZ | $50 |
| **ElastiCache Redis** | cache.t3.micro | $15 |
| **SES** | 1,000 emails/month | $0.10 |
| **CloudWatch Logs** | 5GB ingestion | $2.50 |
| **Route53** | 1 hosted zone | $0.50 |
| **Data Transfer** | 10GB outbound | $0.90 |
| **SNS** | 1,000 notifications | $0.50 |
| **TOTAL** | | **$119.50/month** |

**Savings Options:**
- Use MongoDB Atlas instead of DocumentDB (-$40)
- Use t3.micro Fargate instead of t3.small (-$15)
- Reduce to single task for staging (-$15)

**Optimized Cost:** $50-60/month

---

## 🔧 TECHNICAL IMPLEMENTATION

### **Phase 1: Pre-Migration Setup (Day 1-2)**

#### **AWS Account Setup**
```bash
# Install AWS CLI
brew install awscli

# Configure credentials
aws configure

# Set region
export AWS_DEFAULT_REGION=us-west-2
```

#### **IAM Roles & Policies**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:*",
        "ecs:*",
        "logs:*",
        "ses:*",
        "sns:*"
      ],
      "Resource": "*"
    }
  ]
}
```

#### **VPC Architecture**
```
VPC: 10.0.0.0/16
├── Public Subnet A: 10.0.1.0/24 (us-west-2a)
├── Public Subnet B: 10.0.2.0/24 (us-west-2b)
├── Private Subnet A: 10.0.10.0/24 (us-west-2a)
└── Private Subnet B: 10.0.20.0/24 (us-west-2b)

NAT Gateway: Public Subnets
ALB: Public Subnets
ECS Tasks: Private Subnets
DocumentDB: Private Subnets
ElastiCache: Private Subnets
```

---

### **Phase 2: Containerization (Day 2-3)**

#### **Dockerfile**
```dockerfile
# backend/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application
COPY . .

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

EXPOSE 8080

CMD ["node", "server.js"]
```

#### **Docker Compose for Local Testing**
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "8080:8080"
    environment:
      - MONGODB_URI=mongodb://mongo:27017/findr
      - NODE_ENV=development
    depends_on:
      - mongo
      - redis
  
  mongo:
    image: mongo:7
    ports:
      - "27017:27017"
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

#### **Build & Test**
```bash
cd ~/Development/findr-health/carrotly-provider-database/backend

# Build image
docker build -t findr-backend:latest .

# Test locally
docker-compose up

# Push to ECR
aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-west-2.amazonaws.com
docker tag findr-backend:latest <account-id>.dkr.ecr.us-west-2.amazonaws.com/findr-backend:latest
docker push <account-id>.dkr.ecr.us-west-2.amazonaws.com/findr-backend:latest
```

---

### **Phase 3: Infrastructure as Code (Day 3-5)**

#### **Terraform (Recommended) or CloudFormation**

**Directory Structure:**
```
infrastructure/
├── main.tf
├── variables.tf
├── outputs.tf
├── vpc.tf
├── ecs.tf
├── alb.tf
├── documentdb.tf
├── redis.tf
├── ses.tf
└── cloudwatch.tf
```

**Key Terraform Resources:**
```hcl
# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "findr-health-cluster"
}

# ECS Task Definition
resource "aws_ecs_task_definition" "app" {
  family                   = "findr-backend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "512"
  memory                   = "1024"
  
  container_definitions = jsonencode([{
    name  = "findr-backend"
    image = "${aws_ecr_repository.app.repository_url}:latest"
    portMappings = [{
      containerPort = 8080
      protocol      = "tcp"
    }]
    environment = [
      { name = "NODE_ENV", value = "production" },
      { name = "MONGODB_URI", value = aws_docdb_cluster.main.endpoint }
    ]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = "/ecs/findr-backend"
        "awslogs-region"        = "us-west-2"
        "awslogs-stream-prefix" = "ecs"
      }
    }
  }])
}

# ECS Service
resource "aws_ecs_service" "app" {
  name            = "findr-backend-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = 2
  launch_type     = "FARGATE"
  
  network_configuration {
    subnets         = aws_subnet.private[*].id
    security_groups = [aws_security_group.ecs_tasks.id]
  }
  
  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = "findr-backend"
    container_port   = 8080
  }
}
```

---

### **Phase 4: Database Migration (Day 5-6)**

#### **Option A: DocumentDB (AWS-managed MongoDB-compatible)**

**Setup:**
```bash
# Create DocumentDB cluster
aws docdb create-db-cluster \
  --db-cluster-identifier findr-health-docdb \
  --engine docdb \
  --master-username admin \
  --master-user-password <secure-password> \
  --vpc-security-group-ids sg-xxxxx

# Create instance
aws docdb create-db-instance \
  --db-instance-identifier findr-health-docdb-instance \
  --db-instance-class db.t3.medium \
  --engine docdb \
  --db-cluster-identifier findr-health-docdb
```

**Migration Strategy:**
```bash
# 1. Backup Railway MongoDB
mongodump --uri="mongodb://railway.app:27017/findr" --out=/tmp/backup

# 2. Restore to DocumentDB
mongorestore --uri="mongodb://admin:password@findr-docdb.cluster-xxxxx.us-west-2.docdb.amazonaws.com:27017" /tmp/backup

# 3. Validate
mongo --host findr-docdb.cluster-xxxxx.us-west-2.docdb.amazonaws.com:27017 \
      --username admin \
      --password <password> \
      --eval "db.bookings.count()"
```

#### **Option B: MongoDB Atlas (Recommended for Simplicity)**

**Pros:**
- No migration needed (already cloud MongoDB)
- Cross-cloud connectivity (Railway → Atlas → AWS)
- Easier management
- Better tooling

**Connection:**
```javascript
// No code changes needed
mongoose.connect(process.env.MONGODB_URI, { /* same options */ })
```

---

### **Phase 5: Email Service (SES Setup) (Day 6)**

#### **SES Configuration**
```bash
# 1. Verify domain
aws ses verify-domain-identity --domain findrhealth.com

# 2. Add DNS records (from verification email)
# TXT: _amazonses.findrhealth.com
# CNAME: xxx._domainkey.findrhealth.com

# 3. Request production access (out of sandbox)
aws ses get-send-quota

# 4. Test sending
aws ses send-email \
  --from "noreply@findrhealth.com" \
  --to "test@example.com" \
  --subject "Test" \
  --text "Test email"
```

#### **Code Changes**
```javascript
// backend/services/NotificationService.js
const AWS = require('aws-sdk');
const ses = new AWS.SES({ region: 'us-west-2' });

async sendEmail(recipient, template, data) {
  const emailConfig = this.getEmailTemplate(template, data);
  
  const params = {
    Source: 'Findr Health <noreply@findrhealth.com>',
    Destination: {
      ToAddresses: [recipient.email]
    },
    Message: {
      Subject: {
        Data: emailConfig.subject
      },
      Body: {
        Html: {
          Data: emailConfig.html
        }
      }
    }
  };
  
  try {
    await ses.sendEmail(params).promise();
    console.log(`[SES] Email sent: ${template} to ${recipient.email}`);
  } catch (error) {
    console.error(`[SES] Email failed: ${error.message}`);
    throw error;
  }
}
```

---

### **Phase 6: CI/CD Pipeline (Day 7)**

#### **GitHub Actions Workflow**
```yaml
# .github/workflows/deploy-aws.yml
name: Deploy to AWS ECS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-west-2
      
      - name: Login to ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1
      
      - name: Build and push Docker image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: findr-backend
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
      
      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster findr-health-cluster \
            --service findr-backend-service \
            --force-new-deployment
```

---

## 🔒 SECURITY CONSIDERATIONS

### **Secrets Management**
```bash
# Store secrets in AWS Secrets Manager
aws secretsmanager create-secret \
  --name findr/backend/mongodb-uri \
  --secret-string "mongodb://..."

# Reference in ECS task definition
{
  "secrets": [
    {
      "name": "MONGODB_URI",
      "valueFrom": "arn:aws:secretsmanager:us-west-2:xxxxx:secret:findr/backend/mongodb-uri"
    }
  ]
}
```

### **Network Security**
```
Security Group Rules:
├── ALB Security Group
│   └── Inbound: 443 (HTTPS) from 0.0.0.0/0
├── ECS Task Security Group
│   └── Inbound: 8080 from ALB SG
├── DocumentDB Security Group
│   └── Inbound: 27017 from ECS Task SG
└── Redis Security Group
    └── Inbound: 6379 from ECS Task SG
```

---

## 📈 MONITORING & ALERTS

### **CloudWatch Dashboards**
```javascript
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/ECS", "CPUUtilization", { "stat": "Average" }],
          [".", "MemoryUtilization", { "stat": "Average" }]
        ],
        "period": 300,
        "region": "us-west-2",
        "title": "ECS Resource Usage"
      }
    }
  ]
}
```

### **Alarms**
```bash
# High CPU
aws cloudwatch put-metric-alarm \
  --alarm-name findr-high-cpu \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --period 300 \
  --statistic Average \
  --threshold 80 \
  --alarm-actions arn:aws:sns:us-west-2:xxxxx:alerts

# Error rate
aws cloudwatch put-metric-alarm \
  --alarm-name findr-high-errors \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --metric-name 5XXError \
  --namespace AWS/ApplicationELB \
  --period 60 \
  --statistic Sum \
  --threshold 10
```

---

## ✅ MIGRATION CHECKLIST

### **Pre-Migration**
- [ ] AWS account created and configured
- [ ] IAM roles and policies set up
- [ ] VPC and subnets created
- [ ] ECR repository created
- [ ] Dockerfile tested locally
- [ ] Environment variables documented

### **Database Migration**
- [ ] MongoDB backup created from Railway
- [ ] DocumentDB cluster created (or Atlas cluster)
- [ ] Data restored and validated
- [ ] Indexes created and optimized
- [ ] Connection string updated in secrets

### **Application Deployment**
- [ ] Docker image built and pushed to ECR
- [ ] ECS task definition created
- [ ] ECS service deployed
- [ ] Health checks passing
- [ ] ALB configured with SSL certificate
- [ ] DNS updated to point to ALB

### **Email & Notifications**
- [ ] SES domain verified
- [ ] Production access granted
- [ ] NotificationService updated to use SES
- [ ] Email templates tested
- [ ] SNS topics created for push notifications

### **Monitoring & Logging**
- [ ] CloudWatch log groups created
- [ ] Application logs flowing to CloudWatch
- [ ] Alarms configured
- [ ] Dashboard created
- [ ] Error tracking set up (Sentry/DataDog)

### **Testing**
- [ ] Health check endpoint responding
- [ ] Booking creation working
- [ ] Payment processing working
- [ ] Calendar integration working
- [ ] Email delivery working
- [ ] Load testing completed

### **Cutover**
- [ ] Final database sync
- [ ] DNS TTL lowered to 300s
- [ ] DNS updated to AWS ALB
- [ ] Railway kept as hot backup for 48 hours
- [ ] Rollback plan tested

---

## 🚨 ROLLBACK PLAN

If migration fails:
1. Update DNS back to Railway (5-minute TTL)
2. Stop ECS tasks to prevent double writes
3. Sync any new data from DocumentDB → Railway MongoDB
4. Investigate issues in AWS environment
5. Fix and retry migration

**Railway Backup Period:** Keep running for 7 days post-migration

---

## 📞 SUPPORT & RESOURCES

**AWS Documentation:**
- ECS Fargate: https://docs.aws.amazon.com/ecs/
- DocumentDB: https://docs.aws.amazon.com/documentdb/
- SES: https://docs.aws.amazon.com/ses/
- Terraform AWS Provider: https://registry.terraform.io/providers/hashicorp/aws/

**Community:**
- AWS Startups: https://aws.amazon.com/startups/
- r/aws: Reddit community for AWS questions
- AWS re:Post: Official Q&A forum

---

## 💰 COST OPTIMIZATION TIPS

1. **Use Reserved Capacity** - 1-year commit saves 40%
2. **Right-size Instances** - Start small, scale up as needed
3. **Use Spot Instances** - For non-critical workloads (dev/staging)
4. **Enable Cost Allocation Tags** - Track spending by service
5. **Set Up Budgets** - Get alerts when approaching limits
6. **Use S3 for Static Assets** - Cheaper than serving from ECS
7. **Implement Caching** - Redis/ElastiCache reduces database load

**Expected Monthly Costs:**
- Startup: $50-80/month
- Growth (100+ bookings/day): $150-300/month
- Scale (1000+ bookings/day): $500-1000/month

---

## 📅 TIMELINE

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| Planning & Setup | 2 days | AWS account, VPC, IAM ready |
| Containerization | 1 day | Docker image tested |
| Infrastructure | 2 days | Terraform configs deployed |
| Database Migration | 1 day | Data migrated and validated |
| Email Service | 1 day | SES configured and tested |
| CI/CD | 1 day | GitHub Actions working |
| Testing | 2 days | Full system validation |
| Cutover | 1 day | DNS switched, monitoring |
| **TOTAL** | **11 days** | Production on AWS |

**Recommended Schedule:**
- Week 1: Planning, setup, development
- Week 2: Testing, cutover, stabilization

---

**END OF AWS MIGRATION PLAN**

**Next Steps:** Begin Phase 1 (AWS account setup) after demo completion.
