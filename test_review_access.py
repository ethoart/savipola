"""Evaluation phone allowlist never widens normal Sri Lankan phone registration."""
from unittest.mock import patch
from fastapi import HTTPException
import community,settings

def run():
    with patch.object(settings,'REVIEW_ONLY',True):
        assert community.phone_number('+1 (650) 555-0101') == '+16505550101'
        assert community.phone_number('+16505550102') == '+16505550102'
        for phone in ('0771234567','+94771234567','+16505550103'):
            try: community.phone_number(phone)
            except HTTPException as exc: assert exc.status_code==403
            else: raise AssertionError('Non-review phone accepted')
    with patch.object(settings,'REVIEW_ONLY',False):
        assert community.phone_number('0771234567') == '+94771234567'
        try: community.phone_number('+16505550101')
        except HTTPException as exc: assert exc.status_code==422
        else: raise AssertionError('Review phone accepted outside evaluation mode')
    print('PASS: review-only phone allowlist and unchanged normal phone validation')

if __name__=='__main__':run()
