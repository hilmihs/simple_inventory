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