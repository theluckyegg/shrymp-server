import { Connection } from 'typeorm';
import { nanoid } from 'nanoid';

import { LinkDomainModel, LinkModel } from '../model';

export interface Link {
	longURL?: string;
	tinyURL?: string;
	createdAt?: Date;
};

export const createLink = ({
	long_url,
	tiny_url
}: {
	long_url: string;
	tiny_url?: string;
}) => {
	const newLink = new LinkModel();

	newLink.long_url = long_url;
	newLink.tiny_url = tiny_url ? tiny_url : nanoid(8);

	return newLink;
};

export const createLinkDomain = ({
	link,
	domain_id
}: {
	link: LinkModel;
	domain_id: number;
}) => {
	const newLinkDomain = new LinkDomainModel();

	newLinkDomain.link = link;
	newLinkDomain.domain = domain_id;

	return newLinkDomain;
};

export const saveLink = async ({
	db,
	newLink,
	domain_id
}: {
	db: Connection;
	newLink: LinkModel;
	domain_id: number;
}): Promise<boolean> => {
	return await new Promise((resolve, reject) => {
		db.transaction(async (transaction) => {
			await transaction.save(newLink);
			await transaction.save(createLinkDomain({
				link: newLink,
				domain_id
			}));
			resolve(true);
		}).catch(() => {
			reject(false);
		});
	});
};

export const findTinyLink = async ({
	db,
	tiny_url
}: {
	db: Connection;
	tiny_url: string;
}): Promise<LinkModel | null> => {
	const link_data: LinkModel[] = await db.query(`
		SELECT * FROM link
		WHERE tiny_url = ?`,
	[ tiny_url ]
	);
	if(link_data.length > 0) {
		return link_data[0];
	} else {
		return null;
	}
};

export const findLinkDomain = async ({
	db,
	tiny_url,
	domain_id
}: {
	db: Connection;
	tiny_url: string;
	domain_id: number;
}): Promise<LinkDomainModel | null> => {
	const linkDomain: LinkDomainModel[] = await db.query(`
		select t1.* from
		(SELECT link_domain.domain_id, link.tiny_url, link.long_url, link.create_date FROM link_domain
		INNER JOIN link
		ON link.id = link_domain.link_id
		WHERE link.tiny_url = ?) as t1
		INNER JOIN domain
		ON domain.id = t1.domain_id
		WHERE domain.id = ?`,
	[ tiny_url, domain_id ]
	);
	
	if(linkDomain.length > 0) {
		return linkDomain[0];
	} else {
		return null;
	}
};