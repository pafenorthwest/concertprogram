import {
    AccompanistInterface,
    ComposerInterface,
    Grade,
    ImportPerformance,
    Instrument,
    MusicalPieceInterface,
    pafe_series,
    parseMusicalPiece,
    PerformanceInterface,
    PerformancePieceInterface,
    PerformerInterface,
    selectGrade,
    selectInstrument
} from "$lib/server/common";
import Papa from 'papaparse';
import {
    insertTable,
    searchAccompanist,
    searchComposer,
    searchMusicalPiece,
    searchPerformer,
    searchPerformanceByPerformer,
    insertPerformance,
    insertPerformancePieceMap, deleteById, deletePerformerLottery
} from "$lib/server/db";
import {createPerformer} from "$lib/server/performer";

interface MusicComponentsInterface {
    composer: string;
    musical_piece: string;
    movements: string | null;
}
export class Performance {
    public accompanist: AccompanistInterface | null
    public performer: PerformerInterface
    public composer_1: ComposerInterface
    public composer_2: ComposerInterface | null
    public musical_piece_1: MusicalPieceInterface
    public musical_piece_2: MusicalPieceInterface | null
    public performance: PerformanceInterface

    async initialize(data: ImportPerformance) {
        // process accompanist
        this.accompanist = await this.processAccompanist(data.accompanist)
        // process performer
        this.performer = await this.processPerformer(data.performer, data.class_name, data.instrument, data.email, data.phone)

        // process musical pieces
        if (data.piece_1 != null ) {
            // process music piece one first
            const parsedMusic = parseMusicalPiece(data.piece_1)
            // process composers: music piece one
            console.log(`return from parse musical piece ${parsedMusic.titleWithoutMovement} ${parsedMusic.movements} ${parsedMusic.composers}`)
            if (parsedMusic.composers != null && parsedMusic.composers.length > 0) {
                this.composer_1 = await this.processComposer(parsedMusic.composers[0])
            } else {
                throw new Error("Unable to process composer for first musical piece");
            }
            if (this.composer_1?.id != null && parsedMusic.titleWithoutMovement != null) {
                this.musical_piece_1 = await this.processMusicalPiece(
                    parsedMusic.titleWithoutMovement,
                    parsedMusic.movements,
                    this.composer_1.id
                )
            } else {
                throw new Error("Returned null when parsing musical title")
            }
            // last part add the performance
            // added performance pieces and the performance
            let accompanist_id = null
            if (this.accompanist?.id != null ) {
                accompanist_id = this.accompanist?.id
            }
            if (this.musical_piece_1.id == null) {
                throw new Error ("Invalid musical piece id, id can not be null")
            }
            this.performance = await this.processPerformance(this.performance,
                this.performer,
                this.musical_piece_1,
                accompanist_id,
                parsedMusic.movements,
                data.concert_series)
        } else {
            throw new Error("Unable to process value for musical piece 1")
        }

        // cont process musical pieces
        if (data.piece_2 != null) {
            const parsedMusic = parseMusicalPiece(data.piece_2)
            // process composers: music piece two
            if (parsedMusic.composers != null && parsedMusic.composers.length > 0) {
                this.composer_2 = await this.processComposer(parsedMusic.composers[0])
            }
            if (this.composer_2?.id != null && parsedMusic.titleWithoutMovement != null) {
                this.musical_piece_2 = await this.processMusicalPiece(
                    parsedMusic.titleWithoutMovement,
                    parsedMusic.movements,
                    this.composer_2.id)
            } else {
                this.musical_piece_2 = null
            }
            // last part add the performance
            // added performance pieces and the performance
            let accompanist_id = null
            if (this.accompanist?.id != null ) {
                accompanist_id = this.accompanist?.id
            }
            if (this.musical_piece_2 == null || this.musical_piece_2?.id == null) {
                throw new Error ("Invalid musical piece id, id can not be null")
            }
            this.performance = await this.processPerformance(this.performance,
                this.performer,
                this.musical_piece_2,
                accompanist_id,
                parsedMusic.movements,
                data.concert_series)
        }

    }
    // searches for matching composer by name returning their id
    // otherwise creates new composer entry
     private async processComposer(composer_name: string): Promise<ComposerInterface>  {
        const res= await searchComposer(composer_name)
        if (res.rowCount == null || res.rowCount < 1) {
            let composer: ComposerInterface = {
                id: null,
                printed_name: composer_name,
                full_name: composer_name,
                years_active: "0-0",
                alias: "added via interface"
            }
            const result = await insertTable('composer', composer)
            // set the new id
            if (result.rowCount > 0 && result[0].id != null) {
                composer.id = result.rows[0].id
            }
            return composer
        }

        return {
            id: res.rows[0].id,
            printed_name: res.rows[0].printed_name,
            full_name: res.rows[0].full_name,
            years_active: res.rows[0].years_active,
            alias: res.rows[0].alias
        }
    }

    // searches for matching accompanist by name returning their id
    // otherwise creates new accompanist entry
    private async processAccompanist(accompanist_name: string | null): Promise<AccompanistInterface | null> {
        if (accompanist_name == null) {
            return null
        }
        // switch to first name last name when given a last name, first order
        accompanist_name = this.reverseCommaSeparated(accompanist_name)
        const res = await searchAccompanist(accompanist_name)
        if (res.rowCount == null || res.rowCount < 1) {
            let accompanist: AccompanistInterface = {
                id: null,
                full_name: accompanist_name
            }
            const result = await insertTable('accompanist', accompanist)
            // set the new id
            if (result.rowCount > 0 && result.rows[0].id != null) {
                accompanist.id = result.rows[0].id
            }
            return accompanist
        }

        return {
            id: res.rows[0].id,
            full_name: res.rows[0].full_name
        }
    }

    private processGradeLevel(class_name: string): Grade {
        const parts = class_name.split(".");
        if (parts.length > 1) {
            return selectGrade(parts[1]) ? selectGrade(parts[1])! : Grade.Grade6to8
        }
        return Grade.Grade6to8;
    }

    private reverseCommaSeparated(input: string): string {
        if (input.includes(',')) {
            // Split the string by the comma, reverse the parts, and join without a comma
            return input
                .split(',')
                .map(part => part.trim())
                .reverse()
                .join(' ');
        }
        // Return the original string if no comma is found
        return input;
    }

    private async processPerformer(full_name: string,
                             class_name: string,
                             instrument: string,
                             email: string | null,
                             phone: string | null ): Promise<PerformerInterface> {

        const grade: Grade = this.processGradeLevel(class_name)
        let normalized_instrument: Instrument | null = selectInstrument(instrument)
        if (normalized_instrument == null) {
            throw new Error (`Can not parse instrument ${instrument} from performer ${full_name}`)
        }

        const res = await searchPerformer(full_name, email, normalized_instrument)
        if (res.rowCount == null || res.rowCount < 1) {
            let importPerformer: PerformerInterface = {
                id: null,
                full_name: full_name,
                grade: grade,
                instrument: normalized_instrument,
                email: email,
                phone: phone
            }
            const new_id = await createPerformer(importPerformer)
            if (new_id != null) {
                importPerformer.id = new_id
                return importPerformer
            } else {
                throw new Error ("Unable to import new performer")
            }

        }
        const normalized_grade: Grade | null = selectGrade(res.rows[0].grade)
        if (normalized_grade == null) {
            throw new Error ("Grade can not be null for performer")
        }
        normalized_instrument = selectInstrument(res.rows[0].instrument)
        if (normalized_instrument == null) {
            throw new Error ("Instrument can not be null for performer")
        }
        return {
            id: res.rows[0].id,
            full_name: res.rows[0].full_name,
            grade: normalized_grade,
            instrument: normalized_instrument,
            email: res.rows[0].email,
            phone: res.rows[0].phone
        }
    }

    private async processMusicalPiece(printed_title: string, movements: string | null, composer_id: number): Promise<MusicalPieceInterface> {
        const res = await searchMusicalPiece(printed_title,composer_id)
        if (res.rowCount == null || res.rowCount < 1) {
            // create new
            let musical_piece: MusicalPieceInterface = {
                id: null,
                printed_name: printed_title,
                first_composer_id: composer_id,
                all_movements:  movements,
                second_composer_id: null,
                third_composer_id: null
            }
            const result = await insertTable('musical_piece', musical_piece)
            if (result.rowCount > 0 && result.rows[0].id != null) {
                musical_piece.id = result.rows[0].id
            } else {
                throw new Error("Unable to create Musical Piece")
            }
        }

        return {
            id: res.rows[0].id,
            printed_name: res.rows[0].printed_name,
            first_composer_id: res.rows[0].first_composer_id,
            all_movements:  res.rows[0].all_movements,
            second_composer_id: res.rows[0].second_composer_id,
            third_composer_id: res.rows[0].third_composer_id
        }
    }

    private async processPerformance(performance: PerformanceInterface,
                                     performer: PerformerInterface,
                                     musical_piece: MusicalPieceInterface,
                                     accompanist_id: number | null,
                                     movements: string | null,
                                     concert_series: string): Promise<PerformanceInterface> {

        if ( performer?.id == null ) {
            throw new Error ("Can't process Performance with null performer")
        }
        if ( musical_piece.id == null ) {
            throw new Error ("Can't process Performance with null musical piece")
        }

        const res = await searchPerformanceByPerformer(performer.id, concert_series, pafe_series())
        if (res.rowCount == null || res.rowCount < 1) {
            let thisPerformance: PerformanceInterface = {
                id: null,
                performer_name: performer.full_name,
                musical_piece: musical_piece.printed_name,
                movements: movements,
                duration: null,
                accompanist_id: accompanist_id,
                concert_series: concert_series,
                pafe_series: pafe_series(),
                instrument: performer.instrument
            }
            const performanceResult = await insertPerformance(
                thisPerformance,
                performer.id,
                musical_piece.id,
                null,
                null,
                null,
                null,
                null
                )
            thisPerformance.id = performanceResult[0].id
            thisPerformance.duration = performanceResult[0].duration
            let performancePieceMap: PerformancePieceInterface = {
                performance_id: performanceResult[0].id,
                musical_piece_id: musical_piece.id,
                movement: movements
            }
            const success = await insertPerformancePieceMap(performancePieceMap)
        }
       return {
            id: res.rows[0].id,
            performer_name: res.rows[0].performer_name,
            musical_piece: res.rows[0].musical_piece_printed_name,
            movements: res.rows[0].movements,
            duration: res.rows[0].duration,
            accompanist_id: res.rows[0].accompanist_id,
            concert_series: res.rows[0].concert_series,
            pafe_series: res.rows[0].pafe_series,
            instrument: res.rows[0].instrument
        }
    }

    public async delete() {
        if (this.performance.id != null && this.performance.id > 0) {
            await deleteById("performance", this.performance.id)
        }
        if (this.accompanist?.id != null && this.accompanist?.id > 0) {
            await deleteById("accompanist", this.accompanist?.id!)
        }
        if (this.musical_piece_1.id != null && this.musical_piece_1.id > 0) {
            await deleteById("musical_piece", this.musical_piece_1.id)
        }
        if (this.performer.id != null && this.performer.id > 0) {
            await deleteById("performer", this.performer.id)
            await deletePerformerLottery(this.performer.id)
        }
    }
}
export class DataParser {
    public performances: Performance[] = [];

    async initialize(data: string, type: "CSV" | "JSON", concert_series: string) {
        let parsedData = []
        if (type === "CSV") {
            parsedData = this.parseCSV(data);
        } else if (type === "JSON") {
            parsedData = this.parseJSON(data);
        } else {
            throw new Error("Invalid data type. Expected 'CSV' or 'JSON'.");
        }
        this.performances =  await Promise.all(parsedData.map(async record => {
            const imported: ImportPerformance = {
                class_name: record.class_name,
                performer: record.performer_name,
                email: record.email,
                phone: record.phone,
                accompanist: record.accompanist,
                instrument: record.instrument,
                piece_1: record.piece_1,
                piece_2: record.piece_2,
                concert_series: record.concert_series,
            }
            const singlePerformance = new Performance()
            await singlePerformance.initialize(imported)
            return singlePerformance
        }))
    }

    private parseCSV(data: string): ImportPerformance[] {
        const parsedData = Papa.parse<ImportPerformance>(data, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: true, // Converts numbers to numbers, booleans, etc.
        });

        if (parsedData.errors.length > 0) {
            throw new Error("Error parsing Import CSV data.");
        }

        // Type assertion to ensure data conforms to ImportPerformance[]
        return parsedData.data as ImportPerformance[];
    }
    private parseJSON(data: string): ImportPerformance[] {
        try {
            const parsedData = JSON.parse(data);
            if (!Array.isArray(parsedData)) {
                throw new Error("JSON data is not an array");
            }

            // map to types
            return parsedData.map((item: any) => ({
                class: String(item.class),
                class_name: String(item.class_name),
                performer: String(item.performer),
                email: String(item.email),
                phone: String(item.phone),
                accompanist: String(item.accompanist),
                instrument: String(item.instrument),
                piece_1: String(item.piece_1),
                piece_2: String(item.piece_2)
            }));
        } catch (error) {
            throw new Error("Invalid JSON format.");
        }
    }
}