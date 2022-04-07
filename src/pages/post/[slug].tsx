import { GetStaticPaths, GetStaticProps } from 'next';
import { Fragment, ReactElement } from 'react';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { RichText } from 'prismic-dom';

import { ptBR } from 'date-fns/locale';
import { format } from 'date-fns';
import { useRouter } from 'next/router';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): ReactElement {
  const router = useRouter();

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  let accumulator = '';

  const postText = post.data.content.reduce((prev, curr) => {
    accumulator = `${prev} ${curr.heading} `;
    accumulator += RichText.asText(curr.body);

    return accumulator.trim();
  }, '');

  const countPostWords = postText.split(/\s+/);

  const timeToRead = Math.ceil(countPostWords.length / 200);

  return (
    <main>
      <div className={styles.banner}>
        <img src={post.data.banner.url} alt="Capa do post" />
      </div>
      <div className={`${commonStyles.container} ${styles.post}`}>
        <div className={styles.postHeader}>
          <h2>{post.data.title}</h2>

          <div className={styles.publicationInfo}>
            <div>
              <FiCalendar />
              <time>
                {' '}
                {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                  locale: ptBR,
                })}
              </time>
            </div>
            <div>
              <FiUser />
              <p>{post.data.author}</p>
            </div>
            <div>
              <FiClock />
              <p>{timeToRead} min</p>
            </div>
          </div>
        </div>

        <div className={styles.postContent}>
          {post.data.content.map(document => {
            return (
              <Fragment key={document.heading}>
                <h3>{document.heading}</h3>
                <div
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={{
                    __html: RichText.asHtml(document.body),
                  }}
                />
              </Fragment>
            );
          })}
        </div>
      </div>
    </main>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query('');

  const paths = posts.results.map(post => {
    return {
      params: { slug: post.uid },
    };
  });

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const { params } = context;
  const prismic = getPrismicClient();
  const response: Post = await prismic.getByUID(
    'posts',
    String(params.slug),
    {}
  );

  return {
    props: { post: response },
    revalidate: 60 * 60, // 1 hour
  };
};
