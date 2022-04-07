import { ReactElement, useState } from 'react';
import { GetStaticProps } from 'next';
import Head from 'next/head';
import ApiSearchResponse from '@prismicio/client/types/ApiSearchResponse';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { FiCalendar, FiUser } from 'react-icons/fi';
import Link from 'next/link';
import Prismic from '@prismicio/client';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): ReactElement {
  const [documents, setDocuments] = useState(postsPagination.results);
  const [nextPageURL, setNextPageURL] = useState(postsPagination.next_page);

  const getMorePostsHandler = async (nextPageUrl: string): Promise<void> => {
    const response = await fetch(nextPageUrl);
    const data: ApiSearchResponse = await response.json();

    setDocuments(prevDocuments => [...prevDocuments, ...data.results]);
    setNextPageURL(data.next_page);
  };

  return (
    <>
      <Head>
        <title>spacetraveling</title>
      </Head>
      <main className={`${commonStyles.container} ${styles.mainContent}`}>
        <div className={styles.postHeading}>
          {documents.map(({ data, uid, first_publication_date }) => (
            <Link href={`/post/${uid}`} key={uid}>
              <a>
                <h2>{data.title}</h2>
                <h3>{data.subtitle}</h3>
                <div className={styles.publicationInfo}>
                  <div>
                    <FiCalendar />
                    <time>
                      {format(new Date(first_publication_date), 'dd MMM yyyy', {
                        locale: ptBR,
                      })}
                    </time>
                  </div>

                  <div>
                    <FiUser />
                    <p>{data.author}</p>
                  </div>
                </div>
              </a>
            </Link>
          ))}
        </div>
        {nextPageURL && (
          <button
            type="button"
            onClick={() => getMorePostsHandler(nextPageURL)}
          >
            Carregar mais posts
          </button>
        )}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query('', {
    pageSize: 1,
  });

  const { results, next_page } = postsResponse;

  const posts = results.map(document => {
    return {
      uid: document.uid,
      first_publication_date: document.first_publication_date,
      data: {
        title: document.data.title,
        subtitle: document.data.subtitle,
        author: document.data.author,
      },
    };
  });

  return {
    props: {
      postsPagination: {
        results: posts,
        next_page,
      },
    },
    revalidate: 60 * 60 * 24, // 24 hours
  };
};
