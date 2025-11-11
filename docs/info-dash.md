# Kalito System Overview

> **This document outlines the core development environment. Keep this file updated with any significant system changes.**

---

## 🖥️ Hardware & OS

- **Device:** K-X360 (laptop)
- **OS:** Ubuntu 24.04.3 LTS
- **Kernel:** 6.14.0-33-generic
- **User:** kalito
### CPU
- **Model:** AMD Ryzen 5 5625U with Radeon Graphics
- **Cores:** 12 (4340 MHz)
### Memory
- **Total:** 30Gi
- **Used:** 14Gi
- **Free:** 1.1Gi
- **Buff/Cache:** 15Gi
- **Available:** 16Gi
### Disks
| Device            | Type   | Size   | Used | Free | Mount Point                  |
|-------------------|--------|--------|------|------|------------------------------|
| /dev/nvme0n1p2    | ext4   | 458G   | 86G  | 349G | /                            |
| /dev/nvme0n1p1    | vfat   | 300M   | 7.8M | 292M | /boot/efi                    |
| /dev/sda          | ext4   | 916G   | 95G  | 776G | /media/kalito/evo-backup     |
### GPU
- **Device:** Advanced Micro Devices, Inc. [AMD/ATI] Barcelo (rev c2)
- **Renderer:** AMD Radeon Graphics (radeonsi, renoir, ACO, DRM 3.61, 6.14.0-33-generic)

---

## 🌐 Networking & Desktop

- **Primary Interface:** wlo1
- **IPv4:** 192.168.1.96
- **MAC:** ac:50:de:6f:fd:dd
- **Internet:** Connected
- **Desktop:** XFCE (Xubuntu)
- **Theme:** Dracula
- **Icons:** PlagueSur

---

## 🛠️ Core CLI Tools

- `git` (1:2.43.0-1ubuntu7.3)
- `curl` (8.5.0-2ubuntu10.6)
- `wget` (1.21.4-1ubuntu4.1)
- `build-essential` (12.10ubuntu1)
- `gcc` (4:13.2.0-7ubuntu1)
- `g++` (4:13.2.0-7ubuntu1)
- `make` (4.3-4.1build2)
- `xfce4-terminal` (Not found)
- `tilix` (Not found)

---

## 🟢 Node.js & Package Managers

- **node:** v22.18.0
- **npm:** 10.9.3
- **pnpm:** 10.18.2

---

## 🗂️ PNPM Workspace Structure

### Root: `kalito-repo@1.0.0`
- **Dependencies:** `@serialport/parser-readline`, `serialport`
- **Dev Dependencies:** ESLint, TypeScript, Prettier, Husky, Lint-Staged
### App: `kalito-space@1.0.0`
- **Dependencies:** `vue`, `vue-router`
- **Dev Dependencies:** Vite, Vitest, Vue Test Utils, ESLint plugins
### Backend: `backend@1.0.0`
- **Dependencies:** `express`, `better-sqlite3`, `cors`, `dotenv`, `helmet`, `openai`, `winston`, `zod`
- **Dev Dependencies:** TypeScript, Jest, Nodemon, Supertest

---
