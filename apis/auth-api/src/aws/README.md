# Storing JWT Keys in AWS Secrets Manager

This guide shows how to store and access your JWT signing keys in **AWS Secrets Manager** for **staging** and **production**.

---

## 0) Prereqs

* Your app runs with an **AWS IAM role** that can call Secrets Manager
  (e.g. ECS task role, Lambda execution role, or EC2 instance profile).
* **AWS CLI v2** is installed and authenticated.
* Set your region:

  ```bash
  export AWS_REGION=eu-west-1   # change to your region
  ```

---

## 1) Pick secret names (one account, namespaced)

Use these secret names:

```
sophon/staging/auth/jwt-keys
sophon/prod/auth/jwt-keys
```

> If you use **separate AWS accounts** for staging and prod, reuse the same name in both accounts (e.g. `sophon/auth/jwt-keys`) and keep environments isolated by account.

---

## 2) Create the secret(s)

Prepare a file **`jwt-keys.json`**:

```json
{
  "access": {
    "kid": "access-2025-09-11",
    "privateKeyPem": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----",
    "publicKeyPem": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
  },
  "refresh": {
    "kid": "refresh-2025-09-11",
    "privateKeyPem": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----",
    "publicKeyPem": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
  }
}
```

> Notes
>
> * Keep the PEMs exactly as shown (with `\n` newlines if stored as JSON).
> * `kid` values are your key IDs; update the date stamp on rotation.

### Create for **staging**

```bash
aws secretsmanager create-secret \
  --name sophon/staging/auth/jwt-keys \
  --description "JWT keys (staging)" \
  --secret-string file://jwt-keys.json
```

### Create for **prod**

```bash
aws secretsmanager create-secret \
  --name sophon/prod/auth/jwt-keys \
  --description "JWT keys (prod)" \
  --secret-string file://jwt-keys.json
```

(Optional) **Verify**:

```bash
aws secretsmanager get-secret-value --secret-id sophon/staging/auth/jwt-keys
```

---

## 3) Grant IAM permissions to the app

Attach this inline policy to the app’s **IAM role** (replace `REGION`/`ACCOUNT`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["secretsmanager:GetSecretValue"],
      "Resource": [
        "arn:aws:secretsmanager:REGION:ACCOUNT:secret:sophon/staging/auth/jwt-keys-*",
        "arn:aws:secretsmanager:REGION:ACCOUNT:secret:sophon/prod/auth/jwt-keys-*"
      ]
    }
  ]
}
```

---

## Tips (optional)

* **Rotation**: to rotate keys, generate new PEMs, bump the `kid`s, and run:

  ```bash
  aws secretsmanager put-secret-value \
    --secret-id sophon/staging/auth/jwt-keys \
    --secret-string file://jwt-keys.json
  ```

  Do the same for prod. Update your app to trust the new `kid`s.
* **Least privilege**: if staging and prod run under different roles, grant each role access only to its environment’s secret.
* **Config**: the app should read `sophon/<env>/auth/jwt-keys` at startup using `GetSecretValue`.
