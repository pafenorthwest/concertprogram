import pkg from 'pg';
const {Pool} = pkg;
import {db_user, db_pass, db_name, db_host, db_port, db_ssl} from '$env/static/private';
import {
    type AccompanistInterface,
    type ComposerInterface,
    type MusicalPieceInterface,
    type PerformerInterface,
    type PerformanceInterface,
    type LotteryInterface,
    type PerformanceFilterInterface,
    type PerformancePieceInterface,
    type PerformerSearchResultsInterface, pafe_series, selectGrade
} from '$lib/server/common';
import {isNonEmptyString} from "$lib/server/common";

const pool = new Pool({
    user: db_user,
    host: db_host,
    database: db_name,
    password: db_pass,
    port: db_port,
    ssl: db_ssl==="true" ? { rejectUnauthorized: false } : undefined,
});

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
                fields = 'id, full_name, email, phone, grade, instrument'
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

export async function lookupByCode(code: string): Promise<PerformerSearchResultsInterface | null> {
    try {
        const connection = await pool.connect();
        // order by Concerto comes first followed by EastSide
        // if you are in the concerto playoff can't also perform in EastSide artists concert
        const searchQuery = "SELECT performer_lottery.performer_id, performance.concert_series \n" +
          "FROM performer_lottery JOIN performance ON performance.performer_id = performance.performer_id \n" +
          "WHERE performer_lottery.lookup_code = '"+code+"' \n" +
          "  AND performance.pafe_series =" + pafe_series() + " \n" +
          "  ORDER BY performance.concert_series ASC";

        const dbResult = await connection.query(searchQuery);
        connection.release()

        if (dbResult.rowCount != null && dbResult.rowCount > 0) {
            return  {
                "performer_id": dbResult.rows[0].performer_id,
                "concert_series": dbResult.rows[0].concert_series
            }
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error executing query:', error);
        throw error;
    }
}

export async function lookupByDetails(performerLastName: string, grade: string, composer: string): Promise<PerformerSearchResultsInterface | null> {

    const gradeSearch = selectGrade(grade)

    try {
        const connection = await pool.connect();
        // order by Concerto comes first followed by EastSide
        // if you are in the concerto playoff can't also perform in EastSide artists concert
        const searchQuery = "SELECT performer.id, performance.concert_series \n" +
          "FROM performer \n"+
          "JOIN performance ON performance.performer_id = performer.id \n" +
          "JOIN performance_pieces ON performance_pieces.performance_id = performance.id \n" +
          "JOIN musical_piece ON musical_piece.id = performance_pieces.musical_piece_id \n" +
          "JOIN composer ON musical_piece.first_composer_id = composer.id \n" +
          "WHERE performer.full_name like '%"+performerLastName+"' \n" +
          "  AND (LOWER(composer.full_name) LIKE '%"+composer.toLowerCase()+"' OR LOWER(composer.alias) = '"+composer.toLowerCase()+"') \n" +
          "  AND performer.grade = '"+gradeSearch+"' \n" +
          "  AND performance.pafe_series =" + pafe_series() + " \n" +
          "  ORDER BY performance.concert_series ASC";

        const dbResult = await connection.query(searchQuery);
        connection.release()

        if (dbResult.rowCount != null && dbResult.rowCount > 0) {
            return  {
                "performer_id": dbResult.rows[0].id,
                "concert_series": dbResult.rows[0].concert_series
            }
        } else {
            return null;
        }
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

export async function insertTable(table: string, data: ComposerInterface | AccompanistInterface | MusicalPieceInterface | PerformerInterface){
    try {
        const connection = await pool.connect();

        let inputCols = "";
        let inputVals = "";
        let return_id = true;

        switch (table) {
            case 'composer':
                inputCols = "(printed_name, full_name, years_active)"
                inputVals = "('"+data.printed_name.replaceAll("'","''").trim()+"', '"+
                    data.full_name.replaceAll("'","''").trim()+"', '"+data.years_active+"')"
                // add alias
                if (isNonEmptyString(data.alias)) {
                    inputCols = inputCols.slice(0, -1) + ", alias)"
                    inputVals = inputVals.slice(0, -1) +", '"+data.alias.replaceAll("'","''").trim()+"')"
                }
                // return id
                break;
            case 'accompanist':
                inputCols = "(full_name)"
                inputVals = "('"+data.full_name.replaceAll("'","''").trim()+"')"
                // return id
                break;
            case 'performer':
                inputCols = "(full_name, grade, instrument)"
                inputVals = "('"+
                    data.full_name.replaceAll("'","''").trim()+"', '"+
                    data.grade+"', '"+
                    data.instrument+
                    "')"
                // add email
                if (isNonEmptyString(data.email)) {
                    inputCols = inputCols.slice(0, -1) + ", email)"
                    inputVals = inputVals.slice(0, -1) +", '"+data.email.replaceAll("'","''").trim()+"')"
                }
                // add phone
                if (isNonEmptyString(data.phone)) {
                    inputCols = inputCols.slice(0, -1) + ", phone)"
                    inputVals = inputVals.slice(0, -1) +", '"+data.phone.replaceAll("'","''").trim()+"')"
                }
                // return id
                break;
            case 'musical_piece':
                inputCols = "(printed_name, first_composer_id)"
                inputVals = "('"+data.printed_name.replaceAll("'","''").trim()+"', '"+
                    data.first_composer_id+"')"
                // add movements
                if (isNonEmptyString(data.all_movements)) {
                    inputCols = inputCols.slice(0, -1) + ", all_movements)"
                    inputVals = inputVals.slice(0, -1) +", '"+data.all_movements.replaceAll("'","''").trim()+"')"
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

        const result = await connection.query(insertSQL)

        // Release the connection back to the pool
        connection.release();

        return result
    } catch (error) {
        console.error('Error executing query:', error);
        throw error;
    }
}

export async function insertPerformance(data: PerformanceInterface,
                                        performer_id: number,
                                        musical_piece_id: number,
                                        order: number | null,
                                        concert_time: Date | null,
                                        warm_up_room_name: string | null,
                                        warm_up_room_start: Date | null,
                                        warm_up_room_end: Date | null) {
    try {
        const connection = await pool.connect()

        let cols = "performer_id, concert_series, pafe_series, instrument"
        let vals = performer_id+", '"+data.concert_series+"', "+data.pafe_series+", '"+data.instrument+"'"

        if (order != null) {
            cols = cols +", order"
            vals = vals +", "+order
        }
        if (data.duration != null) {
            cols = cols +", duration"
            vals = vals +", "+ data.duration
        }
        if (data.accompanist_id != null) {
            cols = cols +", accompanist_id"
            vals = vals +", "+data.accompanist_id
        }
        if (concert_time != null) {
            cols = cols +", concert_time"
            vals = vals +", '"+concert_time.toTimeString()+"'"
        }
        if (warm_up_room_name != null) {
            cols = cols +", warm_up_room_name"
            vals = vals +", '"+warm_up_room_name+"'"
        }
        if (warm_up_room_start != null) {
            cols = cols +", warm_up_room_start"
            vals = vals +", '"+warm_up_room_start.toTimeString()+"'"
        }
        if (warm_up_room_end != null ) {
            cols = cols +", warm_up_room_end"
            vals = vals +", '"+warm_up_room_end.toTimeString()+"'"
        }

        cols = "("+cols+")"
        vals = "("+vals+")"

        const insertSQL= "INSERT INTO PERFORMANCE " + cols + " VALUES " + vals + "RETURNING id";
        const result = await connection.query(insertSQL)

        // Release the connection back to the pool
        connection.release();
        return result
    } catch (error) {
        console.error('Error executing insertPerformance:', error);
        throw error;
    }
}

export async function updatePerformance(data: PerformanceInterface,
                                        performer_id: number,
                                        musical_piece_id: number,
                                        order: number | null,
                                        concert_time: Date | null,
                                        warm_up_room_name: string | null,
                                        warm_up_room_start: Date | null,
                                        warm_up_room_end: Date | null) {
    try {
        const connection = await pool.connect()

        let setCols = "performer_id = "+performer_id+
            ", concert_series = '"+data.concert_series+
            ", pafe_series = "+data.pafe_series+
            ", instrument = '"+data.instrument

        if (order != null) {
            setCols = setCols + ", order = "+order
        }
        if (data.duration != null) {
            setCols = setCols + ", duration = "+data.duration
        }
        if (data.accompanist_id != null) {
            setCols = setCols + ", accompanist_id = "+data.accompanist_id
        }
        if (concert_time != null) {
            setCols = setCols + ", concert_time = '"+concert_time.toTimeString()+"'"
        }
        if (warm_up_room_name != null) {
            setCols = setCols + ", warm_up_room_name = '"+warm_up_room_name+"'"
        }
        if (warm_up_room_start != null) {
            setCols = setCols + ", warm_up_room_start = '"+warm_up_room_start.toTimeString()+"'"
        }
        if (warm_up_room_end != null ) {
            setCols = setCols + ", warm_up_room_end = '"+warm_up_room_end.toTimeString()+"'"
        }

        const updateSQL= "UPDATE PERFORMANCE SET "+setCols+" WHERE performance.id = "+data.id;
        const result = await connection.query(updateSQL)

        // Release the connection back to the pool
        connection.release();

        return result

    } catch (error) {
        console.error('Error executing insertPerformance:', error);
        throw error;
    }
}

export async function updateById(table: string, data: ComposerInterface | AccompanistInterface | MusicalPieceInterface | PerformerInterface | LotteryInterface){
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
            case 'performer':
                // don't wipe out data
                if (! (isNonEmptyString(data.full_name) &&
                    isNonEmptyString(data.instrument) &&
                    isNonEmptyString(data.grade))
                ) {
                    return null
                }
                setCols = "full_name = '"+data.full_name+"'"
                setCols = setCols + ", instrument = '"+data.instrument+"'"
                setCols = setCols + ", grade = '"+data.grade+"'"
                if (isNonEmptyString(data.email)) {
                    setCols = setCols + ", email = '" + data.email + "' "
                }
                if (isNonEmptyString(data.phone)) {
                    setCols = setCols + ", email = '" + data.phone + "' "
                }
                break;
            case 'musical_piece':
                // don't wipe out data
                if (isNonEmptyString(data.printed_name) &&
                    isNonEmptyString(data.first_composer_id)
                ) {
                    return null
                }
                setCols = "printed_name = '"+data.printed_name.replaceAll("'","''").trim()+"'"
                setCols = setCols + ", first_composer_id = '"+data.first_composer_id+"'"
                if (isNonEmptyString(data.all_movements)) {
                    setCols = setCols + ", all_movements = '" + data.all_movements.replaceAll("'","''").trim() + "' "
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
        console.log(`updateSQL: ${updateSQL}`)
        const result = await connection.query(updateSQL)

        // Release the connection back to the pool
        connection.release();

        return result.rowCount
    } catch (error) {
        console.error('Error executing updateById:', error);
        throw error;
    }
}

export async function insertPerformancePieceMap(performancePieceMap: PerformancePieceInterface) {
    try {
        const connection = await pool.connect();

        let insertSQL = "INSERT INTO performance_pieces "
        if (performancePieceMap.movement != null) {
            insertSQL = insertSQL + "(performance_id, musical_piece_id, movement) "
            insertSQL = insertSQL + "VALUES ("+performancePieceMap.performance_id+", "+performancePieceMap.musical_piece_id+", '"+performancePieceMap.movement+"' )"
        } else {
            insertSQL = insertSQL + "(performance_id, musical_piece_id) "
            insertSQL = insertSQL + "VALUES ("+performancePieceMap.performance_id+", "+performancePieceMap.musical_piece_id+" )"
        }
        const result = connection.query(insertSQL);

        // Release the connection back to the pool
        connection.release();

        return result;
    } catch (error) {
        console.error('Error executing query:', error);
        throw error;
    }
}

export async function deletePerformancePieceMap(performancePieceMap: PerformancePieceInterface) {
    try {
        const connection = await pool.connect();

        const deleteSQL = "DELETE FROM performance_pieces where performance_id = " + performancePieceMap.performance_id
        + " AND musical_piece_id = " + performancePieceMap.musical_piece_id
        const result = connection.query(deleteSQL);

        // Release the connection back to the pool
        connection.release();

        return result;
    } catch (error) {
        console.error('Error executing query:', error);
        throw error;
    }
}

export async function updatePerformancePieceMap(performancePieceMap: PerformancePieceInterface) {
    await deletePerformancePieceMap(performancePieceMap)
    await insertPerformancePieceMap(performancePieceMap)
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

export async function updatePerformerLottery(performerId: number, pafe_series: number, data: LotteryInterface){
    try {
        const connection = await pool.connect();

        const updateSQL= "UPDATE performer_lottery"+
            "        SET lottery = "+data.lottery+","+
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

export async function insertPerformerLottery(performerId: number, pafe_series: number, data: LotteryInterface){
    try {
        const connection = await pool.connect();

        const insertSQL= "INSERT INTO performer_lottery"+
            "        (performer_id, lottery, lookup_code, pafe_series) "+
            "        VALUES ("+performerId+", "+data.lottery+", '"+data.base34Lottery+"', "+pafe_series+")"

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

        const deleteSQL= "DELETE FROM performer_lottery WHERE performer_id = "+performerId

        const result = await connection.query(deleteSQL)

        // Release the connection back to the pool
        connection.release()
        return result
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

export async function queryPerformances(filters?: PerformanceFilterInterface) {
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
     *     duration: number;
     *     concert_time: datetime;
     *     instrument: string | null;
     *     performance_order: number default 100;
     *     concert_series: string (Eastside | Concerto Playoff);
     *     pafe_series: number of years of pafe
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
            "            performance.performance_order, performance.concert_series, performance.pafe_series\n"
        const joins = " JOIN performance_pieces ON performance.id = performance_pieces.performance_id\n" +
            "        JOIN musical_piece ON performance_pieces.musical_piece_id = musical_piece.id\n" +
            "        JOIN composer First ON First.id = musical_piece.first_composer_id\n" +
            "        LEFT JOIN composer Second ON Second.id = musical_piece.second_composer_id\n" +
            "        LEFT JOIN composer Third ON Third.id = musical_piece.second_composer_id\n" +
            "        LEFT JOIN accompanist ON performance.accompanist_id = accompanist.id\n"
        const order = "ORDER BY performance.pafe_series, performance.concert_series, performance.performance_order"


        let queryFilter = ""
        if (typeof(filters) != "undefined" && Object.entries(filters).length > 0) {
            queryFilter = "WHERE "+Object.entries(filters)
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
                .filter(([_, value]) => value !== null) // filter out null values
                .map(([key, value]) => `${key} = ${value}`)
                .join(', ');
        }
        queryFilter = queryFilter + "\n";

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

export async function searchComposer(composer_name: string) {
    try {
        const connection = await pool.connect();

        const searchSQL = "SELECT id, printed_name, full_name, years_active, alias " +
            "FROM composer " +
            "WHERE full_name = '" + composer_name + "' OR LOWER(alias) = '" + composer_name.toLowerCase() + "'"

        const result = connection.query(searchSQL);

        // Release the connection back to the pool
        connection.release();

        return result;
    } catch (error) {
        console.error('Error executing query:', error);
        throw error;
    }
}

export async function searchAccompanist(accompanist: string) {
    try {
        const connection = await pool.connect();

        const searchSQL = "SELECT id, full_name " +
            "FROM accompanist " +
            "WHERE LOWER(full_name) = '" + accompanist.toLowerCase() + "'"

        const result = connection.query(searchSQL);

        // Release the connection back to the pool
        connection.release();

        return result;
    } catch (error) {
        console.error('Error executing query:', error);
        throw error;
    }
}

export async function searchPerformer(full_name: string, email: string | null, instrument: string) {
    try {
        const connection = await pool.connect();

        let searchSQL = "SELECT id, full_name, grade, email, phone, instrument " +
            "FROM performer " +
            "WHERE (LOWER(full_name) = '" + full_name.toLowerCase() + "' AND instrument = '" + instrument + "') "
        if (email != null) {
            searchSQL = searchSQL + " OR (LOWER(email) = '" + email.toLowerCase() + "')"
        }

        const result = connection.query(searchSQL);

        // Release the connection back to the pool
        connection.release();

        return result;
    } catch (error) {
        console.error('Error executing query:', error);
        throw error;
    }
}

export async function searchMusicalPiece(printed_name: string, first_composer_id: number) {
    try {
        const connection = await pool.connect();

        const searchSQL = "SELECT id, printed_name, first_composer_id, all_movements, second_composer_id, third_composer_id " +
            "FROM musical_piece " +
            "WHERE LOWER(printed_name) = '" + printed_name.toLowerCase().replaceAll("'","''").trim() +
            "' AND first_composer_id = " + first_composer_id

        const result = connection.query(searchSQL);

        // Release the connection back to the pool
        connection.release();

        return result;
    } catch (error) {
        console.error('Error executing query:', error);
        throw error;
    }
}

export async function searchPerformanceByPerformer(performer_id: number, concert_series: string, pafe_series: number) {
    try {
        const connection = await pool.connect();

        const searchSQL = "SELECT performance.id, performer.full_name as performer_name, \n"+
            "musical_piece.printed_name as musical_piece_printed_name, \n"+
            "performance.performer_id, performance.performance_order, \n"+
            "performance.concert_series, performance.pafe_series, performance.duration, performance.accompanist_id \n" +
            "concert_time, performance.instrument, warm_up_room_name, warm_up_room_start, warm_up_room_end \n" +
            "FROM performance \n" +
            "JOIN performance_pieces ON performance.id = performance_pieces.performance_id \n" +
            "JOIN musical_piece ON performance_pieces.musical_piece_id = musical_piece.id \n" +
            "JOIN performer ON performance.performer_id = performer.id \n" +
            "WHERE performer_id = " + performer_id + "\n   "+
            "    AND LOWER(concert_series) = '" + concert_series.toLowerCase() + "' \n" +
            "    AND pafe_series = " + pafe_series

        const result = connection.query(searchSQL);

        // Release the connection back to the pool
        connection.release();

        return result;
    } catch (error) {
        console.error('Error executing query:', error);
        throw error;
    }
}
