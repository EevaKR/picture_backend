# 🚀 Rahti (OpenShift) Deployment Guide

This guide explains how to deploy the Picture Store API to Rahti (CSC's OpenShift platform).

## 📋 Prerequisites

- Rahti account and project access
- `oc` CLI tool installed
- Git repository with your code

## 🔑 Application Secrets

Create secrets for sensitive environment variables that the application needs:

```bash
# Create application secrets
oc create secret generic app-secrets \
  --from-literal=JWT_SECRET=your-secure-jwt-secret-64-characters-long \
  --from-literal=MONGODB_URI=mongodb://your-mongodb-connection-string

# Verify secrets
oc get secrets | grep app-secrets
```

## 🏗️ Build Configuration

Create a BuildConfig for building the Docker image:

```yaml
# buildconfig.yaml
apiVersion: build.openshift.io/v1
kind: BuildConfig
metadata:
  name: picture-store-api
spec:
  source:
    type: Git
    git:
      uri: https://github.com/your-username/your-repo.git
      ref: main
  strategy:
    type: Docker
    dockerStrategy: {}
  output:
    to:
      kind: ImageStreamTag
      name: picture-store-api:latest
```

Apply the BuildConfig:
```bash
oc apply -f buildconfig.yaml
```

## 🚀 Deployment Configuration

Create a DeploymentConfig:

```yaml
# deploymentconfig.yaml
apiVersion: apps.openshift.io/v1
kind: DeploymentConfig
metadata:
  name: picture-store-api
spec:
  replicas: 1
  selector:
    app: picture-store-api
  template:
    metadata:
      labels:
        app: picture-store-api
    spec:
      containers:
      - name: picture-store-api
        image: picture-store-api:latest
        ports:
        - containerPort: 3001
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "3001"
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: JWT_SECRET
        - name: MONGODB_URI
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: MONGODB_URI
        volumeMounts:
        - name: uploads-volume
          mountPath: /app/uploads
        - name: data-volume
          mountPath: /app/data
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 5
      volumes:
      - name: uploads-volume
        persistentVolumeClaim:
          claimName: uploads-pvc
      - name: data-volume
        persistentVolumeClaim:
          claimName: data-pvc
  triggers:
  - type: ImageChange
    imageChangeParams:
      automatic: true
      containerNames:
      - picture-store-api
      from:
        kind: ImageStreamTag
        name: picture-store-api:latest
```

## 💾 Persistent Volume Claims

Create PVCs for data persistence:

```yaml
# pvc.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: uploads-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: data-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
```

## 🔒 Application Secrets

Create secrets for sensitive environment variables:

```bash
# Create application secrets
oc create secret generic app-secrets \
  --from-literal=JWT_SECRET=your-secure-jwt-secret-64-characters-long \
  --from-literal=MONGODB_URI=mongodb://your-mongodb-connection-string

# Verify secrets
oc get secrets | grep app-secrets
```

## 🌐 Service and Route

Create a Service and Route to expose the application:

```yaml
# service-route.yaml
apiVersion: v1
kind: Service
metadata:
  name: picture-store-api-service
spec:
  selector:
    app: picture-store-api
  ports:
  - port: 3001
    targetPort: 3001
---
apiVersion: route.openshift.io/v1
kind: Route
metadata:
  name: picture-store-api-route
spec:
  to:
    kind: Service
    name: picture-store-api-service
  port:
    targetPort: 3001
  tls:
    termination: edge
    insecureEdgeTerminationPolicy: Redirect
```

## 📝 Complete Deployment Steps

1. **Login to Rahti:**
```bash
oc login https://rahti.csc.fi:8443
oc project your-project-name
```

2. **Create secrets:**
```bash
# Application secrets
oc create secret generic app-secrets \
  --from-literal=JWT_SECRET=your-jwt-secret \
  --from-literal=MONGODB_URI=your-mongodb-uri
```

3. **Create persistent volumes:**
```bash
oc apply -f pvc.yaml
```

4. **Create and start build:**
```bash
oc apply -f buildconfig.yaml
oc start-build picture-store-api
```

5. **Deploy application:**
```bash
oc apply -f deploymentconfig.yaml
```

6. **Expose service:**
```bash
oc apply -f service-route.yaml
```

7. **Check deployment:**
```bash
# Check pods
oc get pods

# Check route
oc get routes

# Check logs
oc logs -f deployment/picture-store-api
```

## 🔍 Monitoring and Troubleshooting

### Check Application Status
```bash
# View all resources
oc get all

# Check pod logs
oc logs -f pod/picture-store-api-xxx

# Check events
oc get events --sort-by='.lastTimestamp'
```

### Health Check
```bash
# Get route URL
ROUTE_URL=$(oc get route picture-store-api-route -o jsonpath='{.spec.host}')

# Test health endpoint
curl https://$ROUTE_URL/health
```

### Scale Application
```bash
# Scale up
oc scale dc/picture-store-api --replicas=3

# Scale down
oc scale dc/picture-store-api --replicas=1
```

## 🔄 Updates and Rollbacks

### Update Application
```bash
# Trigger new build
oc start-build picture-store-api

# Or rollout latest
oc rollout latest dc/picture-store-api
```

### Rollback
```bash
# View rollout history
oc rollout history dc/picture-store-api

# Rollback to previous version
oc rollout undo dc/picture-store-api
```

## 📊 Resource Limits

Add resource limits to the DeploymentConfig:

```yaml
resources:
  limits:
    memory: "512Mi"
    cpu: "500m"
  requests:
    memory: "256Mi"
    cpu: "250m"
```

## 🔒 Security Best Practices

1. **Use secrets for sensitive data**
2. **Enable HTTPS with TLS termination**
3. **Set resource limits**
4. **Use health checks**
5. **Run as non-root user** (already configured in Dockerfile)
6. **Keep images updated**

## 🆘 Common Issues

### Build Fails
- Check Git repository is accessible
- Verify Dockerfile is present and correct
- Check build logs: `oc logs -f bc/picture-store-api`

### Pod Won't Start
- Check secrets exist and are correctly named
- Verify environment variables
- Check resource limits

### Health Check Fails
- Ensure `/health` endpoint is implemented
- Check port configuration (3001)
- Verify application is actually starting

---

For more help, check the [Rahti documentation](https://docs.csc.fi/cloud/rahti/) or contact CSC support.
