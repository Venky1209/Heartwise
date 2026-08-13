#!/bin/bash
git filter-branch -f --env-filter '
CORRECT_NAME="Venkat1209"
CORRECT_EMAIL="venkat.kaushal12@gmail.com"

if [ "$GIT_COMMITTER_NAME" = "venkat" ] || [ "$GIT_COMMITTER_NAME" = "Gugan K" ]
then
    export GIT_COMMITTER_NAME="$CORRECT_NAME"
    export GIT_COMMITTER_EMAIL="$CORRECT_EMAIL"
fi
if [ "$GIT_AUTHOR_NAME" = "venkat" ] || [ "$GIT_AUTHOR_NAME" = "Gugan K" ]
then
    export GIT_AUTHOR_NAME="$CORRECT_NAME"
    export GIT_AUTHOR_EMAIL="$CORRECT_EMAIL"
fi
' --tag-name-filter cat -- --branches --tags
