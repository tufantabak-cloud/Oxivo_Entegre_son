# DELETE METODLARI EKLENECEK

Şu API'lere delete metodu eklenecek:

## 1. partnershipsApi (satır 1133'ten sonra)
```typescript
  async delete(id: string) {
    console.log(`🗑️ Deleting partnership ${id} from Supabase...`);
    
    const { error } = await supabase
      .from('partnerships')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Error deleting partnership:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Deleted partnership ${id} from Supabase`);
    return { success: true };
  },
```

## 2. sharingApi (satır 1328'den sonra)
```typescript
  async delete(id: string) {
    console.log(`🗑️ Deleting sharing ${id} from Supabase...`);
    
    const { error } = await supabase
      .from('sharings')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Error deleting sharing:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Deleted sharing ${id} from Supabase`);
    return { success: true };
  },
```

## 3. kartProgramApi (satır 1391'den sonra)
```typescript
  async delete(id: string) {
    console.log(`🗑️ Deleting card program ${id} from Supabase...`);
    
    const { error } = await supabase
      .from('card_programs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Error deleting card program:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Deleted card program ${id} from Supabase`);
    return { success: true };
  },
```

## 4. suspensionReasonApi (satır 1454'ten sonra)
```typescript
  async delete(id: string) {
    console.log(`🗑️ Deleting suspension reason ${id} from Supabase...`);
    
    const { error } = await supabase
      .from('suspension_reasons')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Error deleting suspension reason:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Deleted suspension reason ${id} from Supabase`);
    return { success: true };
  },
```
