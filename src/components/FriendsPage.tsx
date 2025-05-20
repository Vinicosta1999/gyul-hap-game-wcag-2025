import { useState, useEffect, FormEvent, useCallback } from 'react';
// import { useRouter } from 'next/router'; // Removido
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import { useTranslation } from 'react-i18next';

interface UserSearchResult {
  id: string;
  username: string;
  friendshipStatus: 'pending' | 'accepted' | 'blocked' | null;
  isRequester: boolean; 
}

interface Friend {
  id: string; 
  username: string;
  friendshipId: string; 
}

interface PendingRequest {
  id: string; 
  sender: {
    id: string;
    username: string;
  };
  status: 'pending'; 
  createdAt: string;
}

const FriendsPage = () => {
  const { t } = useTranslation();
  const { token, user } = useAuth();
  const { socket, emitEvent, onEvent, offEvent, isConnected } = useSocket();
  // const router = useRouter(); // Removido

  const navigateTo = (path: string) => {
    window.location.href = path;
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  const clearMessages = () => {
    setError(null);
    setSuccessMessage(null);
  };

  const fetchFriends = useCallback(async () => {
    if (!token) return;
    setIsLoadingFriends(true);
    clearMessages();
    try {
      const response = await fetch(`${API_URL}/friendships`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || t('friends_page_error_fetching_friends'));
      }
      const data: Friend[] = await response.json();
      setFriends(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoadingFriends(false);
    }
  }, [token, t, API_URL]);

  const fetchPendingRequests = useCallback(async () => {
    if (!token) return;
    setIsLoadingRequests(true);
    clearMessages();
    try {
      const response = await fetch(`${API_URL}/friendships/pending`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || t('friends_page_error_fetching_requests'));
      }
      const data: PendingRequest[] = await response.json();
      setPendingRequests(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoadingRequests(false);
    }
  }, [token, t, API_URL]);

  useEffect(() => {
    if (token) {
        fetchFriends();
        fetchPendingRequests();
    }
  }, [token, fetchFriends, fetchPendingRequests]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewFriendRequest = (request: PendingRequest) => {
      setSuccessMessage(t('friends_page_notification_new_request', { sender: request.sender.username }));
      setPendingRequests(prev => [request, ...prev]);
    };

    const handleFriendRequestAccepted = (data: { friendshipId: string, friend: {id: string, username: string} }) => {
      setSuccessMessage(t('friends_page_notification_request_accepted', { friend: data.friend.username }));
      fetchFriends(); 
      fetchPendingRequests(); 
    };

    const handleFriendRequestRejected = (data: { requestId: string, recipientUsername: string }) => {
        setSuccessMessage(t('friends_page_notification_request_rejected_by', { recipient: data.recipientUsername }));
        fetchPendingRequests();
    };
    
    const handleFriendshipRemoved = (data: { friendshipId: string, removedBy: string }) => {
        const removedByName = friends.find(f => f.friendshipId === data.friendshipId || f.id === data.removedBy)?.username || 'User';
        setSuccessMessage(t('friends_page_notification_friend_removed_by', { user: removedByName }));
        fetchFriends();
        fetchPendingRequests(); 
    };

    onEvent('newFriendRequest', handleNewFriendRequest);
    onEvent('friendRequestAccepted', handleFriendRequestAccepted);
    onEvent('friendRequestRejected', handleFriendRequestRejected);
    onEvent('friendshipRemoved', handleFriendshipRemoved);

    return () => {
      offEvent('newFriendRequest', handleNewFriendRequest);
      offEvent('friendRequestAccepted', handleFriendRequestAccepted);
      offEvent('friendRequestRejected', handleFriendRequestRejected);
      offEvent('friendshipRemoved', handleFriendshipRemoved);
    };
  }, [socket, isConnected, onEvent, offEvent, fetchFriends, fetchPendingRequests, t, friends]);

  const handleSearchUsers = async (event: FormEvent) => {
    event.preventDefault();
    if (!searchQuery.trim() || !token) return;
    setIsLoadingSearch(true);
    clearMessages();
    try {
      const response = await fetch(`${API_URL}/friendships/search?username=${encodeURIComponent(searchQuery)}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || t('friends_page_error_searching_users'));
      }
      const data: UserSearchResult[] = await response.json();
      setSearchResults(data);
      if (data.length === 0) {
        setSuccessMessage(t('friends_page_no_users_found'));
      }
    } catch (err: any) {
      setError(err.message);
      setSearchResults([]);
    } finally {
      setIsLoadingSearch(false);
    }
  };

  const handleSendFriendRequest = async (recipientId: string) => {
    if (!token) return;
    clearMessages();
    try {
      const response = await fetch(`${API_URL}/friendships/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ recipientId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || t('friends_page_error_sending_request'));
      setSuccessMessage(data.message || t('friends_page_success_request_sent'));
      setSearchResults(prev => prev.map(u => u.id === recipientId ? { ...u, friendshipStatus: 'pending', isRequester: true } : u));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRespondToRequest = async (requestId: string, accept: boolean) => {
    if (!token) return;
    clearMessages();
    try {
      const response = await fetch(`${API_URL}/friendships/request/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ response: accept ? 'accept' : 'reject' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || t('friends_page_error_responding_request'));
      setSuccessMessage(data.message || (accept ? t('friends_page_success_request_accepted') : t('friends_page_success_request_rejected')));
      fetchFriends();
      fetchPendingRequests();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRemoveFriendOrCancelRequest = async (friendshipId: string, listType: 'friend' | 'searchResult') => {
    if (!token) return;
    clearMessages();
    try {
      const response = await fetch(`${API_URL}/friendships/${friendshipId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || t('friends_page_error_removing_friend'));
      setSuccessMessage(data.message || t('friends_page_success_friend_removed'));
      fetchFriends();
      fetchPendingRequests();
      if (listType === 'searchResult') {
        handleSearchUsers(new Event('submit') as any); 
      }
    } catch (err: any) {
      setError(err.message);
    }
  };
  
  const handleInviteToGame = (friendId: string) => {
    if (!socket || !isConnected) {
        setError(t('socket_not_connected_error'));
        return;
    }
    const roomId = prompt(t('friends_page_prompt_room_id_for_invite'));
    if (roomId && friendId) {
        console.log(`Inviting friend ${friendId} to room ${roomId}`);
        emitEvent('inviteToRoom', { friendId, roomId });
        setSuccessMessage(t('friends_page_invite_sent', { friendUsername: friends.find(f=>f.id === friendId)?.username || 'Friend'}));
    }
  };

  return (
    <div className="container mx-auto p-4 min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{t('friends_page_title')}</h1>
        <button 
            onClick={() => navigateTo('/lobby')}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
        >
            {t('back_to_lobby_button')}
        </button>
      </div>

      {error && <p role="alert" className="text-red-500 bg-red-100 dark:bg-red-800 p-3 rounded-md mb-4">{error}</p>}
      {successMessage && <p role="alert" className="text-green-500 bg-green-100 dark:bg-green-800 p-3 rounded-md mb-4">{successMessage}</p>}

      <section aria-labelledby="search-users-heading" className="mb-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h2 id="search-users-heading" className="text-xl font-semibold mb-3">{t('friends_page_search_users_title')}</h2>
        <form onSubmit={handleSearchUsers} className="flex flex-col sm:flex-row gap-2 mb-4">
          <label htmlFor="search-query-input" className="sr-only">{t('friends_page_search_placeholder')}</label>
          <input
            id="search-query-input"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('friends_page_search_placeholder')}
            className="flex-grow p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
          <button 
            type="submit" 
            disabled={isLoadingSearch || !searchQuery.trim()}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            {isLoadingSearch ? t('form_button_loading') : t('search_button_text')}
          </button>
        </form>
        {isLoadingSearch && <p>{t('loading_text')}</p>}
        {!isLoadingSearch && searchResults.length > 0 && (
          <ul className="space-y-2">
            {searchResults.map(foundUser => (
              <li key={foundUser.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md flex flex-col sm:flex-row justify-between items-center gap-2">
                <span>{foundUser.username}</span>
                <div className="flex gap-2">
                  {user && foundUser.id !== user.id && foundUser.friendshipStatus === null && (
                    <button 
                        onClick={() => handleSendFriendRequest(foundUser.id)}
                        className="bg-green-500 hover:bg-green-600 text-white text-sm py-1 px-3 rounded"
                    >
                        {t('friends_page_send_request_button')}
                    </button>
                  )}
                  {user && foundUser.id !== user.id && foundUser.friendshipStatus === 'pending' && foundUser.isRequester && (
                    <span className="text-sm text-yellow-600 dark:text-yellow-400">{t('friends_page_request_sent_status')}</span>
                  )}
                  {user && foundUser.id !== user.id && foundUser.friendshipStatus === 'pending' && !foundUser.isRequester && (
                    <span className="text-sm text-blue-600 dark:text-blue-400">{t('friends_page_request_received_status')}</span>
                  )}
                  {foundUser.friendshipStatus === 'accepted' && (
                    <span className="text-sm text-green-600 dark:text-green-400">{t('friends_page_already_friends_status')}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
        {!isLoadingSearch && searchQuery && searchResults.length === 0 && <p>{t('friends_page_no_users_found_for_query', { query: searchQuery })}</p>}
      </section>

      <section aria-labelledby="pending-requests-heading" className="mb-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h2 id="pending-requests-heading" className="text-xl font-semibold mb-3">{t('friends_page_pending_requests_title')}</h2>
        {isLoadingRequests && <p>{t('loading_text')}</p>}
        {!isLoadingRequests && pendingRequests.length === 0 && (
          <p>{t('friends_page_no_pending_requests')}</p>
        )}
        {!isLoadingRequests && pendingRequests.length > 0 && (
          <ul className="space-y-2">
            {pendingRequests.map(req => (
              <li key={req.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md flex flex-col sm:flex-row justify-between items-center gap-2">
                <span>{t('friends_page_request_from', { username: req.sender.username })}</span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleRespondToRequest(req.id, true)}
                    className="bg-green-500 hover:bg-green-600 text-white text-sm py-1 px-3 rounded"
                  >
                    {t('accept_button_text')}
                  </button>
                  <button 
                    onClick={() => handleRespondToRequest(req.id, false)}
                    className="bg-red-500 hover:bg-red-600 text-white text-sm py-1 px-3 rounded"
                  >
                    {t('reject_button_text')}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="friends-list-heading" className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h2 id="friends-list-heading" className="text-xl font-semibold mb-3">{t('friends_page_friends_list_title')}</h2>
        {isLoadingFriends && <p>{t('loading_text')}</p>}
        {!isLoadingFriends && friends.length === 0 && (
          <p>{t('friends_page_no_friends_yet')}</p>
        )}
        {!isLoadingFriends && friends.length > 0 && (
          <ul className="space-y-2">
            {friends.map(friend => (
              <li key={friend.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md flex flex-col sm:flex-row justify-between items-center gap-2">
                <span>{friend.username}</span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleInviteToGame(friend.id)} 
                    className="bg-purple-500 hover:bg-purple-600 text-white text-sm py-1 px-3 rounded"
                  >
                    {t('friends_page_invite_to_game_button')}
                  </button>
                  <button 
                    onClick={() => handleRemoveFriendOrCancelRequest(friend.friendshipId, 'friend')}
                    className="bg-red-500 hover:bg-red-600 text-white text-sm py-1 px-3 rounded"
                  >
                    {t('friends_page_remove_friend_button')}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default FriendsPage;

