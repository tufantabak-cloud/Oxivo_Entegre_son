#!/bin/bash

# Renkler
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

clear

echo ""
echo "╔════════════════════════════════════════════════╗"
echo "║   🌐 YÖNETİM UYGULAMASI BAŞLATILIYOR          ║"
echo "║   📡 Mod: Network Erişimi AKTIF               ║"
echo "║   📱 WiFi'deki cihazlardan erişilebilir       ║"
echo "╚════════════════════════════════════════════════╝"
echo ""
echo -e "${YELLOW}⏳ Uygulama hazırlanıyor...${NC}"
echo ""
echo -e "${BLUE}📍 Erişim adresleri:${NC}"
echo -e "   ${GREEN}💻 Bu bilgisayar: http://localhost:5173${NC}"
echo -e "   ${CYAN}📱 Mobil cihazlar: Aşağıda gösterilen IP'yi kullanın${NC}"
echo ""
echo "────────────────────────────────────────────────"
echo ""

npm run dev:host

echo ""
echo "────────────────────────────────────────────────"
echo -e "${YELLOW}⚠️  Uygulama kapatıldı${NC}"
echo ""
