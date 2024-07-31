import pkg from 'pg';
const {Pool} = pkg;
import {db_user, db_pass, db_name, db_host, db_port} from '$env/static/private';
import type {Accompanist, Composer, MusicalPiece, Performer, PerformerRankedChoice, Lottery} from "$lib/server/common";
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
            case 'performer':
                fields = 'id, full_name, email, phone, instrument'
                break;
            case 'musical_piece':
                fields = 'id, printed_name, first_composer_id, all_movements, second_composer_id, third_composer_id'
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

export async function insertTable(table: string, data: Composer | Accompanist | MusicalPiece | Performer){
    try {
        const connection = await pool.connect();

        let inputCols = "";
        let inputVals = "";
        let return_id = true;

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
                // return id
                break;
            case 'accompanist':
                inputCols = "(full_name)"
                inputVals = "('"+data.full_name+"')"
                // return id
                break;
            case 'performer':
                inputCols = "(full_name, instrument)"
                inputVals = "('"+data.full_name+"', '"+
                    data.instrument+"')"
                // add email
                if (isNonEmptyString(data.email)) {
                    inputCols = inputCols.slice(0, -1) + ", email)"
                    inputVals = inputVals.slice(0, -1) +", '"+data.email+"')"
                }
                // add phone
                if (isNonEmptyString(data.phone)) {
                    inputCols = inputCols.slice(0, -1) + ", phone)"
                    inputVals = inputVals.slice(0, -1) +", '"+data.phone+"')"
                }
                // return id
                break;
            case 'musical_piece':
                inputCols = "(printed_name, first_composer_id)"
                inputVals = "('"+data.printed_name+"', '"+
                    data.first_composer_id+"')"
                // add movements
                if (isNonEmptyString(data.all_movements)) {
                    inputCols = inputCols.slice(0, -1) + ", all_movements)"
                    inputVals = inputVals.slice(0, -1) +", '"+data.all_movements+"')"
                }
                // add another composer
                if (isNonEmptyString(data.second_composer_id)) {
                    inputCols = inputCols.slice(0, -1) + ", second_composer_id)"
                    inputVals = inputVals.slice(0, -1) +", '"+data.second_composer_id+"')"
                }
                if (isNonEmptyString(data.third_composer_id)) {
                    inputCols = inputCols.slice(0, -1) + ", third_composer_id)"
                    inputVals = inputVals.slice(0, -1) +", '"+data.third_composer_id+"')"
                }
                //return id
                break;
        }

        let insertSQL="INSERT INTO "+table+" "+inputCols+" VALUES "+inputVals
        if (return_id) {
            insertSQL = insertSQL + " RETURNING id"
        }
        console.log(insertSQL)
        const result = await connection.query(insertSQL)

        // Release the connection back to the pool
        connection.release();

        return result
    } catch (error) {
        console.error('Error executing query:', error);
        throw error;
    }
}

export async function updateById(table: string, data: Composer | Accompanist | MusicalPiece | Performer | Lottery){
    try {
        const connection = await pool.connect();

        let setCols = "";

        console.log("processing update for "+table);

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
            case 'performer':
                // don't wipe out data
                if (! (isNonEmptyString(data.full_name) &&
                    isNonEmptyString(data.instrument))
                ) {
                    return null
                }
                setCols = "full_name = '"+data.full_name+"'"
                setCols = setCols + ", instrument = '"+data.instrument+"'"
                if (isNonEmptyString(data.email)) {
                    setCols = setCols + ", email = '" + data.email + "' "
                }
                if (isNonEmptyString(data.phone)) {
                    setCols = setCols + ", email = '" + data.phone + "' "
                }
                break;
            case 'musical_piece':
                // don't wipe out data
                if (! (isNonEmptyString(data.printed_name) &&
                    isNonEmptyString(data.first_composer_id))
                ) {
                    return null
                }
                setCols = "printed_name = '"+data.printed_name+"'"
                setCols = setCols + ", first_composer_id = '"+data.first_composer_id+"'"
                if (isNonEmptyString(data.all_movements)) {
                    setCols = setCols + ", all_movements = '" + data.all_movements + "' "
                }
                if (isNonEmptyString(data.second_composer_id)) {
                    setCols = setCols + ", email = '" + data.second_composer_id + "' "
                }
                if (isNonEmptyString(data.third_composer_id)) {
                    setCols = setCols + ", email = '" + data.third_composer_id + "' "
                }
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

export async function getPerformerLottery(performerId: number) {
    try {
        const connection = await pool.connect();

        const result = connection.query(
            'SELECT performer_id, lottery, lookup_code, pafe_series'+
            '       FROM performer_lottery'+
            '       WHERE performer_id = '+performerId
        );

        // Release the connection back to the pool
        connection.release();

        return result;
    } catch (error) {
        console.error('Error executing query:', error);
        throw error;
    }
}

export async function updatePerformerLottery(performerId: number, pafe_series: number, data: Lottery){
    try {
        const connection = await pool.connect();

        const updateSQL= "UPDATE performer_lottery"+
            "        SET lottery = "+data.lottery+","
            "        lookup_code = '"+data.base34Lottery+"',"+
            "        pafe_series = "+pafe_series+
            "        WHERE performer_id = "+performerId

        const result = await connection.query(updateSQL)

        // Release the connection back to the pool
        connection.release()

        return result
    } catch (error) {
        console.error('Error executing query:', error);
        throw error
    }
}

export async function insertPerformerLottery(performerId: number, pafe_series: number, data: Lottery){
    try {
        const connection = await pool.connect();

        const insertSQL= "INSERT INTO performer_lottery"+
            "        (performer_id, lottery, lookup_code, pafe_series) "+
            "        VALUES ("+performerId+", "+data.lottery+", '"+data.base34Lottery+"', "+pafe_series+")"

        console.log(insertSQL)
        const result = await connection.query(insertSQL)

        // Release the connection back to the pool
        connection.release()

        return result
    } catch (error) {
        console.error('Error executing query:', error);
        throw error
    }
}

export async function deletePerformerLottery(performerId: number) {
    try {
        const connection = await pool.connect();

        const deleteSQL= "DELETE performer_lottery WHERE performer_id = "+performerId

        const result = await connection.query(deleteSQL)

        // Release the connection back to the pool
        connection.release()

    } catch (error) {
        console.error('Error executing query:', error);
        throw error
    }
}

export async function ticketCollision(base34Code: string){
    try {
        const connection = await pool.connect();

        const result = connection.query(
            "SELECT lookup_code FROM performer_lottery WHERE lookup_code ='"+base34Code+"'"
        );

        // Release the connection back to the pool
        connection.release();

        return result;
    } catch (error) {
        console.error('Error executing query:', error);
        throw error;
    }
}

export async function queryPerformances(filters?: {name: string}) {
    /**
     *     id: number | null;
     *     musical_piece: string;
     *     movement: string
     *     composer: string - first composer could be several
     *     composer_years_active: string -first composer could be several
     *     composer2: string - mostly empty
     *     composer2_years_active: string - mostly empty
     *     composer3: string - almost always empty
     *     composer3_years_active: string -s almost always empty
     *     accompanist: string;
     *     performance duration: number;
     *     performance concert time: datetime;
     *     performance instrument: string | null;
     *     performance order: number default 100;
     *     performance concert series: string (Eastside | Concerto Playoff);
     *     performance pafe series: number of years of pafe
     *
     */
    try {
        const connection = await pool.connect();

        const fields = "performance.id, " +
            "            musical_piece.printed_name AS musical_piece,\n" +
            "            performance_pieces.movement,\n" +
            "            First.printed_name AS composer, First.years_active AS composer_years_active,\n" +
            "            Second.printed_name AS composer2, Second.years_active AS composer2_years_active,\n" +
            "            Third.printed_name AS composer3, Third.years_active AS composer3_years_active,\n" +
            "            accompanist.full_name AS accompanist,\n" +
            "            performance.duration, performance.concert_time, performance.instrument,\n" +
            "            performance.performance_order, performance.concert_series, performance.pafe_series"
        const joins = "JOIN performance_pieces ON performance.performance_id = performance_pieces.performance_id\n" +
            "        JOIN musical_piece ON performance_pieces.musical_piece_id = musical_piece.id\n" +
            "        JOIN composer First ON First.id = musical_piece.first_composer_id\n" +
            "        LEFT JOIN composer Second ON Second.id = musical_piece.second_composer_id\n" +
            "        LEFT JOIN composer Third ON Third.id = musical_piece.second_composer_id\n" +
            "        LEFT JOIN accompanist ON performance.accompanist_id = accompanist.id"
        const order = "ORDER BY performance.pafe_series, performance.concert_series, performance.performance_order"


        let queryFilter = ""
        if (typeof(filters) != "undefined" && Object.entries(filters).length > 0) {
            queryFilter = "WHERE "+Object.entries(filters)
                .map(([key, value]) => `${key} = ${value}`)
                .join(', ');
        }

        const result = connection.query(
            'SELECT '+fields+' FROM performance'+joins+queryFilter+order
        );

        // Release the connection back to the pool
        connection.release();

        return result;
    } catch (error) {
        console.error('Error executing query:', error);
        throw error;
    }
}
