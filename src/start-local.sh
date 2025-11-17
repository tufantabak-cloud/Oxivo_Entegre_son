#!/bin/bash

# Renkler
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

clear

echo ""
echo "╔════════════════════════════════════════════════╗"
echo "║   🚀 YÖNETİM UYGULAMASI BAŞLATILIYOR          ║"
echo "║   📍 Mod: Sadece bu bilgisayarda              ║"
echo "╚════════════════════════════════════════════════╝"
echo ""
echo -e "${YELLOW}⏳ Uygulama hazırlanıyor...${NC}"
echo ""
echo -e "${BLUE}📍 Erişim adresi:${NC}"
echo -e "   ${GREEN}👉 http://localhost:5173${NC}"
echo ""
echo -e "${YELLOW}💡 İpucu: Uygulamayı kapatmak için Ctrl+C basın${NC}"
echo ""
echo "────────────────────────────────────────────────"
echo ""

npm run dev

echo ""
echo "────────────────────────────────────────────────"
echo -e "${YELLOW}⚠️  Uygulama kapatıldı${NC}"
echo ""
