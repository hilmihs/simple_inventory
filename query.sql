CREATE OR REPLACE FUNCTION update_harga_beli() RETURNS TRIGGER AS $set_total_harga_beli$
    DECLARE
        harga_beli_barang NUMERIC;
    BEGIN
        SELECT harga_varian INTO harga_beli_barang FROM varian WHERE id_barang = NEW.id_varian;
        NEW.harga_beli := harga_beli_barang;
        NEW.total_harga := NEW.qty * harga_beli_barang;
        RETURN NEW;
    END;

$set_total_harga_beli$ LANGUAGE plpgsql;

CREATE TRIGGER set_total_harga_beli
AFTER INSERT OR UPDATE OR DELETE ON pembelian_detail
    FOR EACH ROW EXECUTE FUNCTION update_harga_beli();




-- bikin delete detail pembelian otomatis
          CREATE OR REPLACE FUNCTION delete_pembelian() RETURNS TRIGGER AS $set_delete_pembelian$
    BEGIN
        IF (TG_OP = 'DELETE') THEN
        DELETE from pembelian_detail WHERE no_invoice = OLD.no_invoice_beli;
        RETURN NULL;
        END IF;
    END;
$set_delete_pembelian$ LANGUAGE plpgsql;

CREATE TRIGGER set_delete_pembelian
AFTER DELETE ON pembelian
    FOR EACH ROW EXECUTE FUNCTION delete_pembelian();
--bikin delete detail penjualan otomatis
    CREATE OR REPLACE FUNCTION delete_penjualan() RETURNS TRIGGER AS $set_delete_penjualan$
    BEGIN
    IF (TG_OP = 'DELETE') THEN
        DELETE from penjualan_detail WHERE no_invoice = NEW.no_invoice_jual;
        RETURN NULL;
        END IF;
    END;
$set_delete_penjualan$ LANGUAGE plpgsql;

CREATE TRIGGER set_delete_penjualan
AFTER DELETE ON penjualan
    FOR EACH ROW EXECUTE FUNCTION delete_penjualan();


