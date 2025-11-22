import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// ========================================
// DATABASE INITIALIZATION
// ========================================
const initDatabase = async () => {
  try {
    console.log("🔍 Checking database table...");
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Tabloyu kontrol et - eğer yoksa oluştur
    const { error: checkError } = await supabase
      .from("kv_store_9ec5bbb3")
      .select("key")
      .limit(1);

    if (checkError) {
      // Tablo yok - oluştur
      console.log("📦 Creating kv_store_9ec5bbb3 table...");
      
      const { error: createError } = await supabase.rpc("exec_sql", {
        sql: `
          CREATE TABLE IF NOT EXISTS kv_store_9ec5bbb3 (
            key TEXT NOT NULL PRIMARY KEY,
            value JSONB NOT NULL
          );
        `
      });

      if (createError) {
        console.error("❌ Table creation failed:", createError.message);
        console.log("⚠️ Please create table manually in Supabase SQL Editor:");
        console.log(`
          CREATE TABLE kv_store_9ec5bbb3 (
            key TEXT NOT NULL PRIMARY KEY,
            value JSONB NOT NULL
          );
        `);
      } else {
        console.log("✅ Table created successfully!");
      }
    } else {
      console.log("✅ Table kv_store_9ec5bbb3 already exists");
    }
  } catch (error: any) {
    console.error("❌ Database initialization error:", error.message);
    console.log("⚠️ Server will continue but data operations may fail");
    console.log("⚠️ Please create table manually in Supabase SQL Editor:");
    console.log(`
      CREATE TABLE kv_store_9ec5bbb3 (
        key TEXT NOT NULL PRIMARY KEY,
        value JSONB NOT NULL
      );
    `);
  }
};

// Initialize database on startup
await initDatabase();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-9ec5bbb3/health", (c) => {
  return c.json({ status: "ok" });
});

// ========================================
// CUSTOMER ENDPOINTS
// ========================================

// GET /customers - Tüm müşterileri getir
app.get("/make-server-9ec5bbb3/customers", async (c) => {
  try {
    const customers = await kv.get("customers");
    return c.json({ success: true, data: customers || [] });
  } catch (error: any) {
    console.error("❌ Error fetching customers:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// GET /customers/:id - Tek müşteri getir
app.get("/make-server-9ec5bbb3/customers/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const customers = await kv.get("customers") || [];
    const customer = customers.find((cust: any) => cust.id === id);

    if (!customer) {
      return c.json({ success: false, error: "Customer not found" }, 404);
    }

    return c.json({ success: true, data: customer });
  } catch (error: any) {
    console.error("❌ Error fetching customer:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// POST /customers - Müşteri ekle/güncelle (toplu)
app.post("/make-server-9ec5bbb3/customers", async (c) => {
  try {
    const body = await c.req.json();
    const { customers, strategy = "replace" } = body;

    if (!Array.isArray(customers)) {
      return c.json(
        { success: false, error: "customers must be an array" },
        400
      );
    }

    let result = customers;

    if (strategy === "merge") {
      // Mevcut müşterileri al
      const existing = (await kv.get("customers")) || [];
      const map = new Map(existing.map((c: any) => [c.id, c]));

      // Yeni müşterileri merge et
      customers.forEach((customer: any) => {
        map.set(customer.id, customer);
      });

      result = Array.from(map.values());
    }

    // Database'e kaydet
    await kv.set("customers", result);

    console.log(
      `✅ Customers saved: ${result.length} total, ${customers.length} imported`
    );

    return c.json({
      success: true,
      data: result,
      stats: {
        total: result.length,
        imported: customers.length,
      },
    });
  } catch (error: any) {
    console.error("❌ Error saving customers:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// PUT /customers/:id - Tek müşteri güncelle
app.put("/make-server-9ec5bbb3/customers/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const updates = await c.req.json();

    const customers = (await kv.get("customers")) || [];
    const index = customers.findIndex((cust: any) => cust.id === id);

    if (index === -1) {
      return c.json({ success: false, error: "Customer not found" }, 404);
    }

    customers[index] = { ...customers[index], ...updates };
    await kv.set("customers", customers);

    console.log(`✅ Customer updated: ${id}`);

    return c.json({ success: true, data: customers[index] });
  } catch (error: any) {
    console.error("❌ Error updating customer:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// DELETE /customers/:id - Müşteri sil
app.delete("/make-server-9ec5bbb3/customers/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const customers = (await kv.get("customers")) || [];
    const filtered = customers.filter((cust: any) => cust.id !== id);

    if (customers.length === filtered.length) {
      return c.json({ success: false, error: "Customer not found" }, 404);
    }

    await kv.set("customers", filtered);

    console.log(`✅ Customer deleted: ${id}`);

    return c.json({ success: true, message: "Customer deleted" });
  } catch (error: any) {
    console.error("❌ Error deleting customer:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ========================================
// PRODUCT ENDPOINTS
// ========================================

// GET /products - Tüm ürünleri getir
app.get("/make-server-9ec5bbb3/products", async (c) => {
  try {
    const products = await kv.get("payterProducts");
    return c.json({ success: true, data: products || [] });
  } catch (error: any) {
    console.error("❌ Error fetching products:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// POST /products/sync - Ürün sync (Excel veya API'den)
app.post("/make-server-9ec5bbb3/products/sync", async (c) => {
  try {
    const body = await c.req.json();
    const { products, source = "excel", strategy = "merge" } = body;

    if (!Array.isArray(products)) {
      return c.json(
        { success: false, error: "products must be an array" },
        400
      );
    }

    let result = products;
    let stats = {
      total: 0,
      added: 0,
      updated: 0,
    };

    if (strategy === "merge") {
      // Mevcut ürünleri al
      const existing = (await kv.get("payterProducts")) || [];

      // Serial number bazlı merge (serialNumber unique)
      const map = new Map(existing.map((p: any) => [p.serialNumber, p]));

      const addedCount = products.filter(
        (p: any) => !map.has(p.serialNumber)
      ).length;

      products.forEach((product: any) => {
        map.set(product.serialNumber, product);
      });

      result = Array.from(map.values());

      stats = {
        total: result.length,
        added: addedCount,
        updated: products.length - addedCount,
      };
    } else {
      stats = {
        total: products.length,
        added: products.length,
        updated: 0,
      };
    }

    // Database'e kaydet
    await kv.set("payterProducts", result);

    // Audit log
    await kv.set(`product_sync_${Date.now()}`, {
      timestamp: new Date().toISOString(),
      source,
      count: products.length,
      strategy,
    });

    console.log(
      `✅ Products synced: ${stats.total} total, ${stats.added} added, ${stats.updated} updated`
    );

    return c.json({
      success: true,
      data: result,
      stats,
    });
  } catch (error: any) {
    console.error("❌ Error syncing products:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ========================================
// DOMAIN ENDPOINTS
// ========================================

// GET /domains - Domain listesi
app.get("/make-server-9ec5bbb3/domains", async (c) => {
  try {
    const domains = await kv.get("domains");
    return c.json({ success: true, data: domains || [] });
  } catch (error: any) {
    console.error("❌ Error fetching domains:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// POST /domains/sync - Domain sync
app.post("/make-server-9ec5bbb3/domains/sync", async (c) => {
  try {
    const body = await c.req.json();
    const { domains } = body;

    if (!Array.isArray(domains)) {
      return c.json(
        { success: false, error: "domains must be an array" },
        400
      );
    }

    await kv.set("domains", domains);

    console.log(`✅ Domains synced: ${domains.length} domains`);

    return c.json({
      success: true,
      data: domains,
      count: domains.length,
    });
  } catch (error: any) {
    console.error("❌ Error syncing domains:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ========================================
// BANK/PF ENDPOINTS
// ========================================

// GET /bankpf - Bank/PF kayıtlarını getir
app.get("/make-server-9ec5bbb3/bankpf", async (c) => {
  try {
    const bankpf = await kv.get("bankPFRecords");
    return c.json({ success: true, data: bankpf || [] });
  } catch (error: any) {
    console.error("❌ Error fetching bankPF:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// POST /bankpf - Bank/PF kayıtlarını kaydet
app.post("/make-server-9ec5bbb3/bankpf", async (c) => {
  try {
    const body = await c.req.json();
    const { records } = body;

    if (!Array.isArray(records)) {
      return c.json(
        { success: false, error: "records must be an array" },
        400
      );
    }

    await kv.set("bankPFRecords", records);

    console.log(`✅ BankPF records saved: ${records.length} records`);

    return c.json({
      success: true,
      data: records,
      count: records.length,
    });
  } catch (error: any) {
    console.error("❌ Error saving bankPF:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

Deno.serve(app.fetch);