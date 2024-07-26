import pkg from 'pg';
const {Pool} = pkg;
import {db_user, db_pass, db_name, db_host, db_port} from '$env/static/private';
import type {Accompanist, Composer} from "$lib/server/common";
import {isNonEmptyString} from "$lib/server/common";


const pool = new Pool({
    user: db_user,
    host: db_host,
    database: db_name,
    password: db_pass,
    port: db_port,
});

/**
export async function openQuery(text: string) {
    try {
        const connection = await pool.connect();

        const result = connection.query(text);

        // Release the connection back to the pool
        connection.release();

        return result;
    } catch (error) {
        console.error('Error executing query:', error);
        throw error;
    }
}
*/
export async function queryTable(table: string, id?: number) {
    try {
        const connection = await pool.connect();

        let fields = ""
        let filter = ""
        let sort = ""
        switch (table) {
            case 'composer':
                fields = 'id, printed_name, full_name, years_active, alias'
                break;
            case 'accompanist':
                fields = 'id, full_name'
                break;
        }
        if (id != null) {
            filter = ' WHERE id='+id
        } else {
            sort = ' ORDER BY id'
        }
        const result = connection.query(
            'SELECT '+fields+' FROM '+table+filter+sort
        );

        // Release the connection back to the pool
        connection.release();

        return result;
    } catch (error) {
        console.error('Error executing query:', error);
        throw error;
    }
}

export async function deleteById(table: string, id: number): Promise<number | null> {
    try {
        const connection = await pool.connect();

        const result = await connection.query("DELETE FROM "+table+" WHERE id = "+id)

        // Release the connection back to the pool
        connection.release();

        return result.rowCount;
    } catch (error) {
        console.error('Error executing query:', error);
        throw error;
    }
}

export async function insertTable(table: string, data: Composer | Accompanist){
    try {
        const connection = await pool.connect();

        let inputCols = "";
        let inputVals = "";

        switch (table) {
            case 'composer':
                inputCols = "(printed_name, full_name, years_active)"
                inputVals = "('"+data.printed_name+"', '"+
                    data.full_name+"', '"+data.years_active+"')"
                // add alias
                if (isNonEmptyString(data.alias)) {
                    inputCols = inputCols.slice(0, -1) + ", alias)"
                    inputVals = inputVals.slice(0, -1) +", '"+data.alias+"')"
                }
                break;
            case 'accompanist':
                inputCols = "(full_name)"
                inputVals = "('"+data.full_name+"')"
                break;
        }

        const insertSQL="INSERT INTO "+table+" "+inputCols+" VALUES "+inputVals
        const result = await connection.query(insertSQL)

        // Release the connection back to the pool
        connection.release();

        return result.rowCount
    } catch (error) {
        console.error('Error executing query:', error);
        throw error;
    }
}

export async function updateById(table: string, data: Composer | Accompanist){
    try {
        const connection = await pool.connect();

        let setCols = "";

        switch (table) {
            case 'composer':
                // don't wipe out data
                if (! (isNonEmptyString(data.printed_name) &&
                    isNonEmptyString(data.full_name) &&
                    isNonEmptyString(data.years_active))
                ) {
                    return null
                }
                setCols = "printed_name= '"+data.printed_name+"'"
                setCols = setCols + ", full_name = '"+data.full_name+"'"
                setCols = setCols + ", years_active = '"+data.years_active+"'"
                if (isNonEmptyString(data.alias)) {
                    setCols = setCols + ", alias = '" + data.alias + "' "
                }
                break;
            case 'accompanist':
                // don't wipe out data
                if (!isNonEmptyString(data.full_name)) {
                    return null
                }
                setCols = "full_name = '"+data.full_name+"'"
                break;
        }

        const updateSQL="UPDATE "+table+" SET "+setCols+" WHERE id="+data.id
        console.log(updateSQL)
        const result = await connection.query(updateSQL)

        // Release the connection back to the pool
        connection.release();

        return result.rowCount
    } catch (error) {
        console.error('Error executing query:', error);
        throw error;
    }
}
