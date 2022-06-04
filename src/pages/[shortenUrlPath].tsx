import is from '@sindresorhus/is';
import type {GetServerSideProps, NextPage} from 'next';
import Error from 'next/error';

import {NOTION_API_TOKEN, NOTION_DATABASE_ID} from '@/constants';
import {NotionDBClient} from '@/server/database';
import {NOTION_URL_SHORTENER_ERROR_STATUS_CODE} from '@/server/errors';
import ShortenModel from '@/server/models/shorten.model';
import {ShortenRepository} from '@/server/repositories/shorten.repository';

const ShortenUrlPath: NextPage<{
	statusCode: number;
}> = ({statusCode}) => <Error statusCode={statusCode} />;

export default ShortenUrlPath;

export const getServerSideProps: GetServerSideProps = async ({query}) => {
	if (is.string(query.shortenUrlPath)) {
		try {
			const notionDatabase = new NotionDBClient({
				auth: NOTION_API_TOKEN,
				databaseId: NOTION_DATABASE_ID,
			});
			const shortenModel = new ShortenModel(notionDatabase);
			const shortenRepository = new ShortenRepository(shortenModel);

			const shorten = await shortenRepository.retrieveShortenUrlPath(
				query.shortenUrlPath,
			);

			if (shorten) {
				return {
					redirect: {
						destination: new URL(shorten.originalUrl).href,
						permanent: false,
					},
				};
			}
		} catch {
			return {
				props: {
					statusCode: NOTION_URL_SHORTENER_ERROR_STATUS_CODE.URL_NOT_FOUND,
				},
			};
		}

		return {
			props: {
				statusCode: NOTION_URL_SHORTENER_ERROR_STATUS_CODE.URL_NOT_FOUND,
			},
		};
	}

	return {
		props: {
			statusCode: NOTION_URL_SHORTENER_ERROR_STATUS_CODE.INVALID_INPUT,
		},
	};
};
