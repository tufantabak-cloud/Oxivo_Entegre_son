import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

// ========================================
// KV STORE UTILITIES
// ========================================
const client = () => createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const kvGet = async (key: string): Promise<any> => {
  const supabase = client();
  const { data, error } = await supabase.from("kv_store_9ec5bbb3").select("value").eq("key", key).maybeSingle();
  if (error) throw new Error(error.message);
  return data?.value;
};

const kvSet = async (key: string, value: any): Promise<void> => {
  const supabase = client();
  const { error } = await supabase.from("kv_store_9ec5bbb3").upsert({ key, value });
  if (error) throw new Error(error.message);
};

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

    const { error: checkError } = await supabase
      .from("kv_store_9ec5bbb3")
      .select("key")
      .limit(1);

    if (checkError) {
      console.error("❌ Table check failed:", checkError.message);
      console.log("⚠️ Please ensure kv_store_9ec5bbb3 table exists in Supabase");
    } else {
      console.log("✅ Table kv_store_9ec5bbb3 ready");
    }
  } catch (error: any) {
    console.error("❌ Database initialization error:", error.message);
  }
};

await initDatabase();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for ALL requests (including OPTIONS)
app.use(
  "*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: false,
  }),
);

// Explicit OPTIONS handler for preflight requests
app.options("*", (c) => {
  return c.text("", 204);
});

// Health check
app.get("/make-server-9ec5bbb3/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ========================================
// CUSTOMER ENDPOINTS
// ========================================

app.get("/make-server-9ec5bbb3/customers", async (c) => {
  try {
    const customers = await kvGet("customers");
    return c.json({ success: true, data: customers || [] });
  } catch (error: any) {
    console.error("❌ Error fetching customers:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.get("/make-server-9ec5bbb3/customers/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const customers = await kvGet("customers") || [];
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
      const existing = (await kvGet("customers")) || [];
      const map = new Map(existing.map((c: any) => [c.id, c]));

      customers.forEach((customer: any) => {
        map.set(customer.id, customer);
      });

      result = Array.from(map.values());
    }

    await kvSet("customers", result);

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

app.put("/make-server-9ec5bbb3/customers/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const updates = await c.req.json();

    const customers = (await kvGet("customers")) || [];
    const index = customers.findIndex((cust: any) => cust.id === id);

    if (index === -1) {
      return c.json({ success: false, error: "Customer not found" }, 404);
    }

    customers[index] = { ...customers[index], ...updates };
    await kvSet("customers", customers);

    console.log(`✅ Customer updated: ${id}`);

    return c.json({ success: true, data: customers[index] });
  } catch (error: any) {
    console.error("❌ Error updating customer:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.delete("/make-server-9ec5bbb3/customers/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const customers = (await kvGet("customers")) || [];
    const filtered = customers.filter((cust: any) => cust.id !== id);

    if (customers.length === filtered.length) {
      return c.json({ success: false, error: "Customer not found" }, 404);
    }

    await kvSet("customers", filtered);

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

app.get("/make-server-9ec5bbb3/products", async (c) => {
  try {
    const products = await kvGet("payterProducts");
    return c.json({ success: true, data: products || [] });
  } catch (error: any) {
    console.error("❌ Error fetching products:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

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
      const existing = (await kvGet("payterProducts")) || [];
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

    await kvSet("payterProducts", result);

    await kvSet(`product_sync_${Date.now()}`, {
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

app.get("/make-server-9ec5bbb3/domains", async (c) => {
  try {
    const domains = await kvGet("domains");
    return c.json({ success: true, data: domains || [] });
  } catch (error: any) {
    console.error("❌ Error fetching domains:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

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

    await kvSet("domains", domains);

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

app.get("/make-server-9ec5bbb3/bankpf", async (c) => {
  try {
    const bankpf = await kvGet("bank_pf_records");
    return c.json({ success: true, data: bankpf || [] });
  } catch (error: any) {
    console.error("❌ Error fetching bankPF:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

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

    await kvSet("bank_pf_records", records);

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