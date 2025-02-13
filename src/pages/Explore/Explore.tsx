import { useEffect, useState } from 'react';
import * as api from '../../api';
import { EntityCreator } from '../../api/types';
import { HeaderSpacer } from '../../components/Header/Header';
import { PageWrapper } from '../../components/layout/Common';
import { UserDisplay } from '../../components/UserDisplay/UserDisplay';

const ExplorePage = () => {
  const limit: number = 20;
  const [users, setUsers] = useState<EntityCreator[]>([]);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);

  useEffect(() => {
    api.creators(page, limit).then((res) => {
      if (res.data) {
        const list = res.data.creators;
        const has = list.length !== 0 && list.length % limit === 0;

        setHasMore(has);
        setUsers([...users, ...list]);
      }
    });
  }, [page]);

  const handleScroll = () => {
    setPage(page + 1);
  };

  return (
    <>
      <PageWrapper>
        <UserDisplay title="Explore the community" users={users} handleScroll={handleScroll} hasMore={hasMore} />
      </PageWrapper>
    </>
  );
};

export { ExplorePage };
