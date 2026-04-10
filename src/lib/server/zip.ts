import { deflateRawSync, inflateRawSync } from 'node:zlib';

const END_OF_CENTRAL_DIRECTORY_SIGNATURE = 0x06054b50;
const CENTRAL_DIRECTORY_FILE_HEADER_SIGNATURE = 0x02014b50;
const LOCAL_FILE_HEADER_SIGNATURE = 0x04034b50;

type ZipEntryRecord = {
	name: string;
	nameBuffer: Buffer;
	comment: Buffer;
	centralExtra: Buffer;
	compressedData: Buffer;
	compressionMethod: number;
	crc32: number;
	diskNumberStart: number;
	externalAttributes: number;
	flags: number;
	internalAttributes: number;
	localExtra: Buffer;
	modificationDate: number;
	modificationTime: number;
	uncompressedSize: number;
	versionMadeBy: number;
	versionNeeded: number;
};

export function readZipEntryText(archive: Buffer, entryName: string): string {
	const entry = parseZipArchive(archive).find((candidate) => candidate.name === entryName);
	if (!entry) {
		throw new Error(`ZIP entry not found: ${entryName}`);
	}

	return decodeZipEntry(entry).toString('utf8');
}

export function replaceZipEntryTexts(
	archive: Buffer,
	replacements: Record<string, string>
): Buffer {
	const entries = parseZipArchive(archive);
	let replacementCount = 0;

	const updatedEntries = entries.map((entry) => {
		const replacement = replacements[entry.name];
		if (replacement == null) {
			return entry;
		}

		replacementCount += 1;
		return updateZipEntry(entry, Buffer.from(replacement, 'utf8'));
	});

	const missingEntries = Object.keys(replacements).filter(
		(entryName) => !entries.some((entry) => entry.name === entryName)
	);
	if (missingEntries.length > 0) {
		throw new Error(`ZIP replacements missing entries: ${missingEntries.join(', ')}`);
	}
	if (replacementCount !== Object.keys(replacements).length) {
		throw new Error('ZIP replacements were not applied consistently');
	}

	return buildZipArchive(updatedEntries);
}

function parseZipArchive(archive: Buffer): ZipEntryRecord[] {
	const endOfCentralDirectoryOffset = locateEndOfCentralDirectory(archive);
	const totalEntries = archive.readUInt16LE(endOfCentralDirectoryOffset + 10);
	const centralDirectoryOffset = archive.readUInt32LE(endOfCentralDirectoryOffset + 16);

	const entries: ZipEntryRecord[] = [];
	let offset = centralDirectoryOffset;

	for (let index = 0; index < totalEntries; index += 1) {
		if (archive.readUInt32LE(offset) !== CENTRAL_DIRECTORY_FILE_HEADER_SIGNATURE) {
			throw new Error(`Invalid ZIP central directory signature at offset ${offset}`);
		}

		const versionMadeBy = archive.readUInt16LE(offset + 4);
		const versionNeeded = archive.readUInt16LE(offset + 6);
		const flags = archive.readUInt16LE(offset + 8);
		const compressionMethod = archive.readUInt16LE(offset + 10);
		const modificationTime = archive.readUInt16LE(offset + 12);
		const modificationDate = archive.readUInt16LE(offset + 14);
		const crc32 = archive.readUInt32LE(offset + 16);
		const compressedSize = archive.readUInt32LE(offset + 20);
		const uncompressedSize = archive.readUInt32LE(offset + 24);
		const fileNameLength = archive.readUInt16LE(offset + 28);
		const extraFieldLength = archive.readUInt16LE(offset + 30);
		const fileCommentLength = archive.readUInt16LE(offset + 32);
		const diskNumberStart = archive.readUInt16LE(offset + 34);
		const internalAttributes = archive.readUInt16LE(offset + 36);
		const externalAttributes = archive.readUInt32LE(offset + 38);
		const localHeaderOffset = archive.readUInt32LE(offset + 42);
		const fileNameStart = offset + 46;
		const fileNameEnd = fileNameStart + fileNameLength;
		const extraFieldEnd = fileNameEnd + extraFieldLength;
		const commentEnd = extraFieldEnd + fileCommentLength;
		const nameBuffer = archive.subarray(fileNameStart, fileNameEnd);
		const centralExtra = archive.subarray(fileNameEnd, extraFieldEnd);
		const comment = archive.subarray(extraFieldEnd, commentEnd);

		const localNameLength = archive.readUInt16LE(localHeaderOffset + 26);
		const localExtraLength = archive.readUInt16LE(localHeaderOffset + 28);
		const localNameStart = localHeaderOffset + 30;
		const localExtraStart = localNameStart + localNameLength;
		const localDataStart = localExtraStart + localExtraLength;
		const compressedDataEnd = localDataStart + compressedSize;

		if (archive.readUInt32LE(localHeaderOffset) !== LOCAL_FILE_HEADER_SIGNATURE) {
			throw new Error(`Invalid ZIP local file header signature at offset ${localHeaderOffset}`);
		}

		entries.push({
			name: nameBuffer.toString('utf8'),
			nameBuffer,
			comment,
			centralExtra,
			compressedData: archive.subarray(localDataStart, compressedDataEnd),
			compressionMethod,
			crc32,
			diskNumberStart,
			externalAttributes,
			flags,
			internalAttributes,
			localExtra: archive.subarray(localExtraStart, localDataStart),
			modificationDate,
			modificationTime,
			uncompressedSize,
			versionMadeBy,
			versionNeeded
		});

		offset = commentEnd;
	}

	return entries;
}

function locateEndOfCentralDirectory(archive: Buffer): number {
	for (let offset = archive.length - 22; offset >= 0; offset -= 1) {
		if (archive.readUInt32LE(offset) === END_OF_CENTRAL_DIRECTORY_SIGNATURE) {
			return offset;
		}
	}

	throw new Error('ZIP end of central directory not found');
}

function updateZipEntry(entry: ZipEntryRecord, contents: Buffer): ZipEntryRecord {
	let compressedData: Buffer;

	if (entry.compressionMethod === 0) {
		compressedData = contents;
	} else if (entry.compressionMethod === 8) {
		compressedData = deflateRawSync(contents);
	} else {
		throw new Error(`Unsupported ZIP compression method: ${entry.compressionMethod}`);
	}

	return {
		...entry,
		compressedData,
		crc32: computeCrc32(contents),
		uncompressedSize: contents.length
	};
}

function decodeZipEntry(entry: ZipEntryRecord): Buffer {
	if (entry.compressionMethod === 0) {
		return entry.compressedData;
	}
	if (entry.compressionMethod === 8) {
		return inflateRawSync(entry.compressedData);
	}

	throw new Error(`Unsupported ZIP compression method: ${entry.compressionMethod}`);
}

function buildZipArchive(entries: ZipEntryRecord[]): Buffer {
	const localFileRecords: Buffer[] = [];
	const centralDirectoryRecords: Buffer[] = [];
	let offset = 0;

	for (const entry of entries) {
		const localHeader = Buffer.alloc(30);
		localHeader.writeUInt32LE(LOCAL_FILE_HEADER_SIGNATURE, 0);
		localHeader.writeUInt16LE(entry.versionNeeded, 4);
		localHeader.writeUInt16LE(entry.flags, 6);
		localHeader.writeUInt16LE(entry.compressionMethod, 8);
		localHeader.writeUInt16LE(entry.modificationTime, 10);
		localHeader.writeUInt16LE(entry.modificationDate, 12);
		localHeader.writeUInt32LE(entry.crc32 >>> 0, 14);
		localHeader.writeUInt32LE(entry.compressedData.length, 18);
		localHeader.writeUInt32LE(entry.uncompressedSize, 22);
		localHeader.writeUInt16LE(entry.nameBuffer.length, 26);
		localHeader.writeUInt16LE(entry.localExtra.length, 28);

		const localRecord = Buffer.concat([
			localHeader,
			entry.nameBuffer,
			entry.localExtra,
			entry.compressedData
		]);
		localFileRecords.push(localRecord);

		const centralHeader = Buffer.alloc(46);
		centralHeader.writeUInt32LE(CENTRAL_DIRECTORY_FILE_HEADER_SIGNATURE, 0);
		centralHeader.writeUInt16LE(entry.versionMadeBy, 4);
		centralHeader.writeUInt16LE(entry.versionNeeded, 6);
		centralHeader.writeUInt16LE(entry.flags, 8);
		centralHeader.writeUInt16LE(entry.compressionMethod, 10);
		centralHeader.writeUInt16LE(entry.modificationTime, 12);
		centralHeader.writeUInt16LE(entry.modificationDate, 14);
		centralHeader.writeUInt32LE(entry.crc32 >>> 0, 16);
		centralHeader.writeUInt32LE(entry.compressedData.length, 20);
		centralHeader.writeUInt32LE(entry.uncompressedSize, 24);
		centralHeader.writeUInt16LE(entry.nameBuffer.length, 28);
		centralHeader.writeUInt16LE(entry.centralExtra.length, 30);
		centralHeader.writeUInt16LE(entry.comment.length, 32);
		centralHeader.writeUInt16LE(entry.diskNumberStart, 34);
		centralHeader.writeUInt16LE(entry.internalAttributes, 36);
		centralHeader.writeUInt32LE(entry.externalAttributes, 38);
		centralHeader.writeUInt32LE(offset, 42);

		const centralRecord = Buffer.concat([
			centralHeader,
			entry.nameBuffer,
			entry.centralExtra,
			entry.comment
		]);
		centralDirectoryRecords.push(centralRecord);
		offset += localRecord.length;
	}

	const centralDirectory = Buffer.concat(centralDirectoryRecords);
	const endOfCentralDirectory = Buffer.alloc(22);
	endOfCentralDirectory.writeUInt32LE(END_OF_CENTRAL_DIRECTORY_SIGNATURE, 0);
	endOfCentralDirectory.writeUInt16LE(0, 4);
	endOfCentralDirectory.writeUInt16LE(0, 6);
	endOfCentralDirectory.writeUInt16LE(entries.length, 8);
	endOfCentralDirectory.writeUInt16LE(entries.length, 10);
	endOfCentralDirectory.writeUInt32LE(centralDirectory.length, 12);
	endOfCentralDirectory.writeUInt32LE(offset, 16);
	endOfCentralDirectory.writeUInt16LE(0, 20);

	return Buffer.concat([...localFileRecords, centralDirectory, endOfCentralDirectory]);
}

function computeCrc32(buffer: Buffer): number {
	let crc = 0xffffffff;

	for (const byte of buffer) {
		crc ^= byte;
		for (let index = 0; index < 8; index += 1) {
			const mask = -(crc & 1);
			crc = (crc >>> 1) ^ (0xedb88320 & mask);
		}
	}

	return (crc ^ 0xffffffff) >>> 0;
}
