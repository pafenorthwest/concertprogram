import {insertClassLottery} from "$lib/server/db";

export async function createLottery(class_name: string, class_lottery: number ): Promise<boolean> {

    try {
        const result = await insertClassLottery(class_name, class_lottery)
        return (result.rowCount != null && result.rowCount > 0)
    } catch {
        return false
    }


}